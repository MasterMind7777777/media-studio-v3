
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateVariablesEditor } from '@/components/Templates/TemplateVariablesEditor';
import { TemplateHeader } from '@/components/Templates/TemplateHeader';
import { useTemplatePreviewUpdater, useTemplateVariables } from '@/hooks/templates';
import { useTemplate } from '@/hooks/api/templates/useTemplate';
import { useCreateRenderJob } from '@/hooks/api/useCreateRenderJob';
import { toast } from '@/components/ui/use-toast';
import { MediaAsset } from '@/types';
import { MediaSelectionDialog } from '@/components/Media/MediaSelectionDialog';
import { CreatomateLoader } from '@/components/CreatomateLoader';
import { normalizeKeys } from '@/lib/variables';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isRendering, setIsRendering] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [currentMediaKey, setCurrentMediaKey] = useState<string>('');

  // Fetch template data
  const { 
    data: template, 
    isLoading: templateLoading, 
    error: templateError 
  } = useTemplate(id);

  // Extract template variables
  const {
    textVariables,
    mediaVariables,
    colorVariables,
    hasVariables
  } = useTemplateVariables(template);
  
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
    onPreviewUpdate: (newVars) => {
      // Since SDK is disabled, just log the updates
      console.log('Variables would update preview:', newVars);
    }
  });

  // Set up render job creation
  const { mutateAsync: createRenderJob, isPending: isSubmitting } = useCreateRenderJob();

  // Handle initial variables
  useEffect(() => {
    if (template?.variables && Object.keys(template.variables).length > 0) {
      console.log('Setting initial template variables:', template.variables);
      // Normalize variables before setting them
      const normalizedVars = normalizeKeys(template.variables);
      console.log('Normalized variables for initialization:', normalizedVars);
      setVariables(normalizedVars);
    }
  }, [template?.variables]);

  // Handle errors
  useEffect(() => {
    if (templateError) {
      toast({
        title: 'Error loading template',
        description: templateError.message
      });
    }
  }, [templateError]);

  // Handle media select button click
  const handleMediaSelect = (key: string) => {
    console.log('Opening media selection dialog for:', key);
    setCurrentMediaKey(key);
    setIsMediaDialogOpen(true);
  };

  // Handle media selection from dialog
  const handleMediaDialogSelect = (asset: MediaAsset) => {
    if (!currentMediaKey) {
      console.error('No media key selected');
      return;
    }
    
    console.log(`Media selected from dialog: ${asset.name} for key ${currentMediaKey}`);
    handleMediaSelected(currentMediaKey, asset);
    setIsMediaDialogOpen(false);
  };

  // Handle render button click
  const handleRender = async () => {
    if (!template || !id) {
      toast({
        title: 'Cannot start render',
        description: 'Template information is missing'
      });
      return;
    }

    setIsRendering(true);
    
    try {
      // Log the variables being sent for rendering
      console.log('Starting render with variables:', variables);
      const result = await createRenderJob({
        templateId: id, 
        variables, // These should be normalized already
        platforms: template.platforms || []
      });

      toast({
        title: 'Render started successfully!',
        description: 'Your video is now being rendered. You will be redirected to the Projects page.'
      });

      // Navigate to projects page with job ID parameter
      navigate(`/projects?job=${result.id}`);
    } catch (error: any) {
      console.error('Render error:', error);
      toast({
        title: 'Failed to start render',
        description: error.message
      });
    } finally {
      setIsRendering(false);
    }
  };

  const isLoading = templateLoading;
  const previewImageUrl = template?.preview_image_url || '/placeholder.svg';

  return (
    <div className="container py-8 max-w-7xl">
      {/* Disabled SDK loader */}
      <CreatomateLoader />
      
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Live preview is temporarily disabled for development. Variable edits won't be reflected in real-time.
        </AlertDescription>
      </Alert>
      
      {template && (
        <TemplateHeader 
          templateName={template.name}
        />
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Area */}
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

        {/* Editor */}
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
      </div>

      {/* Media Selection Dialog */}
      <MediaSelectionDialog
        open={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onSelect={handleMediaDialogSelect}
      />
    </div>
  );
};
