
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateVariablesEditor } from '@/components/Templates/TemplateVariablesEditor';
import { TemplateHeader } from '@/components/Templates/TemplateHeader';
import { useCreatomatePreview, useTemplatePreviewUpdater, useTemplateVariables } from '@/hooks/templates';
import { useTemplate } from '@/hooks/api/templates/useTemplate';
import { useCreateRenderJob } from '@/hooks/api/useCreateRenderJob';
import { toast } from '@/components/ui/use-toast';
import { MediaAsset } from '@/types';
import { MediaSelectionDialog } from '@/components/Media/MediaSelectionDialog';
import { CreatomateLoader } from '@/components/CreatomateLoader';

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isRendering, setIsRendering] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [currentMediaKey, setCurrentMediaKey] = useState<string>('');
  const [sdkStatus, setSDKStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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
  
  // Setup template variables updater
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
      // This will be called whenever variables change
      if (creatomatePreview.isReady && creatomatePreview.preview) {
        console.log('Forcing preview update with new variables');
        creatomatePreview.forceUpdateVariables(newVars);
      }
    }
  });

  // Set up Creatomate preview with improved error handling
  const creatomatePreview = useCreatomatePreview({
    containerId: 'creatomate-preview',
    templateId: template?.creatomate_template_id,
    variables: variables,
    onReady: () => {
      console.log('Preview is ready');
      setSDKStatus('ready');
    },
    onError: (error) => {
      console.error('Preview error:', error);
      setSDKStatus('error');
    }
  });

  // Set up render job creation
  const { mutateAsync: createRenderJob, isPending: isSubmitting } = useCreateRenderJob();

  // Handle initial variables
  useEffect(() => {
    if (template?.variables && Object.keys(template.variables).length > 0) {
      console.log('Setting initial template variables:', template.variables);
      setVariables(template.variables);
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
      console.log('Starting render with variables:', variables);
      const result = await createRenderJob({
        templateId: id, 
        variables, 
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

  const isLoading = templateLoading || creatomatePreview.isLoading;

  return (
    <div className="container py-8 max-w-7xl">
      {/* Load the Creatomate SDK */}
      <CreatomateLoader />
      
      {template && (
        <TemplateHeader 
          templateName={template.name}
        />
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-pulse text-muted-foreground">Loading preview...</div>
            </div>
          )}

          {sdkStatus === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <div className="text-destructive mb-2">Failed to load preview</div>
              <button 
                className="px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/80"
                onClick={() => {
                  setSDKStatus('loading');
                  creatomatePreview.retryInitialization();
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div 
            id="creatomate-preview" 
            className="w-full h-full"
            data-testid="creatomate-preview"
          />
        </div>

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
