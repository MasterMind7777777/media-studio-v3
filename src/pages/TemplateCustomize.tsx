
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateVariablesEditor } from '@/components/Templates/TemplateVariablesEditor';
import { TemplateHeader } from '@/components/Templates/TemplateHeader';
import { useCreatomatePreview } from '@/hooks/templates';
import { useTemplate, useCreateRenderJob } from '@/hooks/api';
import { Button } from "@/components/ui/button";
import { toast } from '@/components/ui/sonner';

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isRendering, setIsRendering] = useState(false);

  // Fetch template data
  const { 
    data: template, 
    isLoading: templateLoading, 
    error: templateError 
  } = useTemplate(id);

  // Set up Creatomate preview
  const { isLoading: previewLoading } = useCreatomatePreview(
    template?.creatomate_template_id, 
    variables
  );

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
      toast.error('Error loading template', {
        description: templateError.message
      });
    }
  }, [templateError]);

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

      toast.success('Render started successfully!', {
        description: 'Your video is now being rendered. You will be redirected to the Projects page.'
      });

      // Navigate to projects page with job ID parameter
      navigate(`/projects?job=${result.id}`);
    } catch (error: any) {
      console.error('Render error:', error);
      toast.error('Failed to start render', {
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
          template={template}
          actions={
            <Button 
              onClick={handleRender} 
              disabled={isSubmitting || isRendering}
            >
              {isSubmitting || isRendering ? 'Starting Render...' : 'Render Video'}
            </Button>
          }
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
              template={template}
              variables={variables}
              onChange={setVariables}
            />
          )}
        </div>
      </div>
    </div>
  );
}
