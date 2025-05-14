
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateVariablesEditor } from '@/components/Templates/TemplateVariablesEditor';
import { TemplateHeader } from '@/components/Templates/TemplateHeader';
import { useTemplatePreviewUpdater, useTemplateVariables, useCreatomatePreview } from '@/hooks/templates';
import { useTemplate } from '@/hooks/api/templates/useTemplate';
import { useCreateRenderJob } from '@/hooks/api/useCreateRenderJob';
import { useToast } from '@/hooks/use-toast';
import { MediaAsset } from '@/types';
import { MediaSelectionDialog } from '@/components/Media/MediaSelectionDialog';
import { isCreatomateDisabled } from '@/components/CreatomateLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isRendering, setIsRendering] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [currentMediaKey, setCurrentMediaKey] = useState<string>('');
  const previewContainerId = 'creatomate-preview-container';

  // Fetch template data
  const { 
    data: template, 
    isLoading: templateLoading, 
    error: templateError 
  } = useTemplate(id);

  // Initialize Creatomate preview
  const {
    currentVars,
    forceUpdateVariables,
    isReady: previewReady,
    error: previewError
  } = useCreatomatePreview({
    containerId: previewContainerId,
    templateId: template?.creatomate_template_id || undefined,
    variables: template?.variables || {},
    onError: (error) => {
      console.error('Preview error:', error);
      // Use ID for error toast to prevent duplicates
      toast({
        id: 'template-preview-error',
        title: "Preview Error",
        description: error.message || "An error occurred with the preview",
        variant: "destructive"
      });
    }
  });
  
  // Handle template variable updates
  const handlePreviewUpdate = useCallback((newVars: Record<string, any>) => {
    console.log('Variables updated:', newVars);
    forceUpdateVariables(newVars);
  }, [forceUpdateVariables]);
  
  // Setup template variables updater with normalized initialVariables
  const {
    variables,
    selectedMedia,
    isUpdating,
    handleTextChange,
    handleColorChange,
    handleMediaSelected,
    setVariables
  } = useTemplatePreviewUpdater({
    initialVariables: template?.variables || {},
    onPreviewUpdate: handlePreviewUpdate
  });

  // Extract template variables
  const {
    textVariables,
    mediaVariables,
    colorVariables,
    hasVariables
  } = useTemplateVariables(template);

  // Set up render job creation
  const { mutateAsync: createRenderJob, isPending: isSubmitting } = useCreateRenderJob();

  // Handle errors
  useEffect(() => {
    if (templateError) {
      console.error('Template error:', templateError);
      toast({
        id: 'template-error',
        title: "Error loading template",
        description: templateError.message || "Failed to load template data",
        variant: "destructive"
      });
    }
  }, [templateError, toast]);

  // Handle media select button click
  const handleMediaSelect = useCallback((key: string) => {
    console.log('Opening media selection dialog for:', key);
    setCurrentMediaKey(key);
    setIsMediaDialogOpen(true);
  }, []);

  // Handle media selection from dialog
  const handleMediaDialogSelect = useCallback((asset: MediaAsset) => {
    try {
      if (!currentMediaKey) {
        console.error('No media key selected');
        return;
      }
      
      console.log(`Media selected from dialog: ${asset.name} for key ${currentMediaKey}`);
      handleMediaSelected(currentMediaKey, asset);
      setIsMediaDialogOpen(false);
    } catch (error) {
      console.error('Error selecting media:', error);
      toast({
        id: 'media-selection-error',
        title: "Error selecting media",
        description: "Please try again",
        variant: "destructive"
      });
      setIsMediaDialogOpen(false);
    }
  }, [currentMediaKey, handleMediaSelected, toast]);

  // Handle render button click with improved error handling
  const handleRender = async () => {
    if (!template || !id) {
      toast({
        id: 'render-missing-data',
        title: "Cannot start render",
        description: "Template information is missing"
      });
      return;
    }

    setIsRendering(true);
    
    try {
      // Performance logging
      console.time('renderJob');
      
      // Log the variables being sent for rendering
      console.log('Starting render with variables:', currentVars);
      const result = await createRenderJob({
        templateId: id, 
        variables: currentVars,
        platforms: template.platforms || []
      });

      console.timeEnd('renderJob');

      toast({
        id: 'render-success',
        title: "Render started successfully!",
        description: "Your video is now being rendered"
      });

      // Navigate to projects page with job ID parameter
      navigate(`/projects?job=${result.id}`);
    } catch (error: any) {
      console.error('Render error:', error);
      toast({
        id: 'render-failure',
        title: "Failed to start render",
        description: error.message || "An unknown error occurred"
      });
    } finally {
      setIsRendering(false);
    }
  };

  const isLoading = templateLoading;
  const previewImageUrl = template?.preview_image_url || '/placeholder.svg';
  
  // Create fallback UI for error boundary
  const errorFallback = (
    <div className="p-6 bg-red-50 text-red-800 rounded-lg">
      <h3 className="font-medium text-lg mb-2">Something went wrong</h3>
      <p>We encountered an error trying to render this template.</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
      >
        Reload page
      </button>
    </div>
  );

  return (
    <div className="container py-8 max-w-7xl">
      {/* Note: CreatomateLoader is already included at the App level, don't duplicate it here */}
      
      {isCreatomateDisabled && (
        <Alert className="mb-4" variant="warning">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Live preview is temporarily disabled for development. Variable edits will be applied when rendering.
          </AlertDescription>
        </Alert>
      )}
      
      {template && (
        <TemplateHeader 
          templateName={template.name}
        />
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Area - Wrapped in ErrorBoundary */}
        <ErrorBoundary fallback={errorFallback}>
          <Card className="overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">Preview</h3>
            </div>
            <div className="relative p-4">
              {isLoading ? (
                <div className="aspect-video bg-muted flex items-center justify-center rounded-md">
                  <p className="text-muted-foreground animate-pulse">Loading template...</p>
                </div>
              ) : (
                <AspectRatio ratio={16/9} className="bg-muted rounded-md overflow-hidden">
                  <div id={previewContainerId} className="h-full w-full flex items-center justify-center flex-col">
                    {/* Creatomate preview will render here */}
                    {!previewReady && previewImageUrl && previewImageUrl !== '/placeholder.svg' && (
                      <img
                        src={previewImageUrl}
                        alt="Template Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading preview image');
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    )}
                  </div>
                </AspectRatio>
              )}

              <div className="mt-4 flex justify-end gap-2">
                {isCreatomateDisabled && (
                  <div className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
                    Preview Disabled
                  </div>
                )}
              </div>
            </div>
          </Card>
        </ErrorBoundary>

        {/* Editor */}
        <ErrorBoundary fallback={errorFallback}>
          <div className="relative">
            {template && (
              <TemplateVariablesEditor
                textVariables={textVariables}
                mediaVariables={mediaVariables}
                colorVariables={colorVariables}
                platforms={template.platforms || []}
                selectedMedia={selectedMedia}
                onTextChange={handleTextChange}
                onColorChange={handleColorChange}
                onMediaSelect={handleMediaSelect}
                isRendering={isRendering}
                isUpdating={isUpdating}
                onRender={handleRender}
              />
            )}
          </div>
        </ErrorBoundary>
      </div>

      {/* Media Selection Dialog */}
      <ErrorBoundary fallback={
        <div className="p-6 bg-red-50 text-red-800 rounded-lg">
          <h3 className="font-medium text-lg mb-2">Something went wrong</h3>
          <p>We encountered an error with the media dialog.</p>
          <button 
            onClick={() => setIsMediaDialogOpen(false)}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
          >
            Close
          </button>
        </div>
      }>
        <MediaSelectionDialog
          open={isMediaDialogOpen}
          onOpenChange={setIsMediaDialogOpen}
          onSelect={handleMediaDialogSelect}
        />
      </ErrorBoundary>
    </div>
  );
}
