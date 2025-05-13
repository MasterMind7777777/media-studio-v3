
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateVariablesEditor } from '@/components/Templates/TemplateVariablesEditor';
import { TemplateHeader } from '@/components/Templates/TemplateHeader';
import { useCreatomatePreview, useTemplateVariables } from '@/hooks/templates';
import { useTemplate } from '@/hooks/api/templates/useTemplate';
import { useCreateRenderJob } from '@/hooks/api/useCreateRenderJob';
import { useToast } from '@/hooks/use-toast';
import { MediaAsset } from '@/types';

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isRendering, setIsRendering] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});

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
  const { isLoading: previewLoading, isUpdating } = useCreatomatePreview({
    containerId: 'creatomate-preview',
    templateId: template?.creatomate_template_id,
    variables: variables,
  });

  // Set up render job creation
  const { mutateAsync: createRenderJob, isPending: isSubmitting } = useCreateRenderJob();
  const { toast } = useToast();

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
  }, [templateError, toast]);

  // Handle text variable changes
  const handleTextChange = (key: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle color variable changes
  const handleColorChange = (key: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle media variable changes
  const handleMediaSelect = (key: string, asset: MediaAsset) => {
    setSelectedMedia(prev => ({
      ...prev,
      [key]: asset
    }));

    setVariables(prev => ({
      ...prev,
      [key]: asset.url
    }));
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
              onMediaSelect={(key) => console.log('Media select for', key)}
              isRendering={isRendering}
              isUpdating={isUpdating}
              onRender={handleRender}
            />
          )}
        </div>
      </div>
    </div>
  );
};
