
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateVariablesEditor } from '@/components/Templates/TemplateVariablesEditor';
import { TemplateHeader } from '@/components/Templates/TemplateHeader';
import { useCreatomatePreview, useTemplateVariables } from '@/hooks/templates';
import { useTemplate } from '@/hooks/api/templates/useTemplate';
import { useCreateRenderJob } from '@/hooks/api/useCreateRenderJob';
import { toast } from '@/components/ui/use-toast';
import { MediaAsset } from '@/types';
import { MediaSelectionDialog } from '@/components/Media/MediaSelectionDialog';

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isRendering, setIsRendering] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
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

  // Set up Creatomate preview
  const { isLoading: previewLoading } = useCreatomatePreview({
    containerId: 'creatomate-preview',
    templateId: template?.creatomate_template_id,
    variables: variables,
  });

  // For updating UI state
  const [isUpdating, setIsUpdating] = useState(false);

  // Set up render job creation
  const { mutateAsync: createRenderJob, isPending: isSubmitting } = useCreateRenderJob();

  // Handle initial variables
  useEffect(() => {
    if (template?.variables && Object.keys(variables).length === 0) {
      setVariables(template.variables);
    }
  }, [template, variables]);

  // Handle errors
  useEffect(() => {
    if (templateError) {
      toast({
        title: 'Error loading template',
        description: templateError.message
      });
    }
  }, [templateError]);

  // Handle text variable changes
  const handleTextChange = (key: string, value: string) => {
    setIsUpdating(true);
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
    setIsUpdating(false);
  };

  // Handle color variable changes
  const handleColorChange = (key: string, value: string) => {
    setIsUpdating(true);
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
    setIsUpdating(false);
  };

  // Open media selection dialog
  const handleMediaSelect = (key: string) => {
    setCurrentMediaKey(key);
    setIsMediaDialogOpen(true);
  };

  // Handle media selection
  const handleMediaSelected = (asset: MediaAsset) => {
    if (currentMediaKey) {
      setSelectedMedia(prev => ({
        ...prev,
        [currentMediaKey]: asset
      }));

      setVariables(prev => ({
        ...prev,
        [currentMediaKey]: asset.file_url
      }));

      setIsMediaDialogOpen(false);
    }
  };

  // Handle render button click
  const handleRender = async () => {
    if (!template || !id) return;

    setIsRendering(true);
    
    try {
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

  const isLoading = templateLoading || previewLoading;

  return (
    <div className="container py-8 max-w-7xl">
      {template && (
        <TemplateHeader 
          templateName={template.name}
        />
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview - The CreatomateLoader handles rendering */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="animate-pulse text-muted-foreground">Loading preview...</div>
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
        onSelect={handleMediaSelected}
      />
    </div>
  );
};
