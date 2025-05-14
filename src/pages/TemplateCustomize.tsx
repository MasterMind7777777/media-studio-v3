
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateVariablesEditor } from '@/components/Templates/TemplateVariablesEditor';
import { TemplateHeader } from '@/components/Templates/TemplateHeader';
import { useTemplatePreviewUpdater, useTemplateVariables } from '@/hooks/templates';
import { useTemplate } from '@/hooks/api/templates/useTemplate';
import { useCreateRenderJob } from '@/hooks/api/useCreateRenderJob';
import { useToast } from '@/hooks/use-toast';
import { MediaAsset } from '@/types';
import { MediaSelectionDialog } from '@/components/Media/MediaSelectionDialog';
import { CreatomateLoader } from '@/components/CreatomateLoader';
import { normalizeKeys } from '@/lib/variables';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Check if Creatomate SDK is disabled using environment variable with fallback
const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

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

  // Fetch template data
  const { 
    data: template, 
    isLoading: templateLoading, 
    error: templateError 
  } = useTemplate(id);

  // Handle preview updates by logging changes
  const handlePreviewUpdate = useCallback((newVars: Record<string, any>) => {
    console.log('Variables updated:', newVars);
  }, []);
  
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

  // Extract template variables - wrapped with a try/catch for safety
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
      toast.error('Error loading template', {
        description: templateError.message
      });
    }
  }, [templateError, toast]);

  // Handle media select button click - with performance improvements
  const handleMediaSelect = useCallback((key: string) => {
    console.log('Opening media selection dialog for:', key);
    setCurrentMediaKey(key);
    setIsMediaDialogOpen(true);
  }, []);

  // Handle media selection from dialog - with error handling
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
      toast.error('Error selecting media', {
        description: 'Please try again'
      });
      setIsMediaDialogOpen(false);
    }
  }, [currentMediaKey, handleMediaSelected, toast]);

  // Handle render button click with improved error handling
  const handleRender = async () => {
    if (!template || !id) {
      toast.error('Cannot start render', {
        description: 'Template information is missing'
      });
      return;
    }

    setIsRendering(true);
    
    try {
      // Performance logging
      console.time('renderJob');
      
      // Log the variables being sent for rendering
      console.log('Starting render with variables:', variables);
      const result = await createRenderJob({
        templateId: id, 
        variables,
        platforms: template.platforms || []
      });

      console.timeEnd('renderJob');

      toast.success('Render started successfully!', {
        description: 'Your video is now being rendered'
      });

      // Navigate to projects page with job ID parameter
      navigate(`/projects?job=${result.id}`);
    } catch (error: any) {
      console.error('Render error:', error);
      toast.error('Failed to start render', {
        description: error.message || 'An unknown error occurred'
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
      {/* Dynamic SDK loader */}
      <CreatomateLoader />
      
      <Alert className="mb-4" variant="warning">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Live preview is temporarily disabled for development. Variable edits will be applied when rendering.
        </AlertDescription>
      </Alert>
      
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
                  <div className="h-full w-full flex items-center justify-center flex-col">
                    {previewImageUrl && previewImageUrl !== '/placeholder.svg' ? (
                      <img
                        src={previewImageUrl}
                        alt="Template Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading preview image');
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center">
                        <AlertTriangle className="h-8 w-8 mb-2" />
                        <p>No preview available</p>
                      </div>
                    )}
                  </div>
                </AspectRatio>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <div className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
                  Preview Disabled
                </div>
              </div>
            </div>
          </Card>
        </ErrorBoundary>

        {/* Editor - Wrapped in ErrorBoundary */}
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

      {/* Media Selection Dialog - Wrapped in ErrorBoundary */}
      <ErrorBoundary fallback={errorFallback}>
        <MediaSelectionDialog
          open={isMediaDialogOpen}
          onOpenChange={setIsMediaDialogOpen}
          onSelect={handleMediaDialogSelect}
        />
      </ErrorBoundary>
    </div>
  );
};
