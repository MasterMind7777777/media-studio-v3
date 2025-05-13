
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useTemplate } from "@/hooks/api";
import { useRenderJob } from "@/hooks/api/useRenderJobs";
import { useTemplatePreview, useTemplateVariables, useCreatomatePreview } from "@/hooks/templates";
import { TemplatePreview } from "@/components/Templates/TemplatePreview";
import { TemplateVariablesEditor } from "@/components/Templates/TemplateVariablesEditor";
import { TemplateHeader } from "@/components/Templates/TemplateHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { renderVideo } from "@/services/creatomate";

export default function TemplateCustomize() {
  const { id: templateIdOrProjectId } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Differentiate between template and project mode
  const isProjectMode = window.location.pathname.includes("/projects/");
  
  // Fetch project data if in project mode
  const { data: project, isLoading: projectLoading } = useRenderJob(
    isProjectMode ? templateIdOrProjectId : undefined
  );
  
  // Get the template ID based on mode
  const templateId = isProjectMode 
    ? project?.template_id 
    : templateIdOrProjectId;
  
  // Fetch template data
  const { data: template, isLoading: templateLoading } = useTemplate(templateId);
  
  // Initialize template variables hook
  const {
    variables,
    setVariables,
    resetVariables,
    isReady: variablesReady
  } = useTemplateVariables(template);
  
  // Initialize Creatomate preview
  const { isLoading: previewLoading } = useCreatomatePreview({
    templateId: template?.creatomate_template_id
  });
  
  // Initialize template preview
  const { updatePreview } = useTemplatePreview();
  
  // Load project variables when in project mode
  useEffect(() => {
    if (isProjectMode && project?.variables && variablesReady) {
      console.log("Loading variables from project", project.variables);
      
      // Compare project variables with template variables
      // to warn about missing keys
      if (template?.variables) {
        const templateVarKeys = new Set(Object.keys(template.variables));
        const projectVarKeys = new Set(Object.keys(project.variables));
        
        // Find keys in template but not in project
        const missingKeys = [...templateVarKeys].filter(key => !projectVarKeys.has(key));
        
        // Find keys in project but not in template
        const extraKeys = [...projectVarKeys].filter(key => !templateVarKeys.has(key));
        
        if (missingKeys.length > 0) {
          toast.warning("Template has been updated", {
            description: `Some variables are missing from your project: ${missingKeys.join(", ")}. Default values will be used.`,
            duration: 6000,
          });
        }
        
        if (extraKeys.length > 0) {
          console.log(`Project has extra variables not in template: ${extraKeys.join(", ")}`);
        }
      }
      
      // Set variables from project
      setVariables(project.variables);
    }
  }, [isProjectMode, project, variablesReady, setVariables, template?.variables]);
  
  // Function to handle render submission
  const handleSubmit = async () => {
    if (!template || !user) return;
    
    try {
      setIsSubmitting(true);
      
      const submitData = {
        user_id: user.id,
        template_id: template.id,
        variables: variables,
        name: `${template.name} - ${new Date().toLocaleString()}`,
        status: "pending" as const,
        platforms: template.platforms,
      };
      
      // Create a new render job in the database
      const { data: renderJob, error: dbError } = await supabase
        .from("render_jobs")
        .insert(submitData)
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      // Call the Creatomate API to render the video
      const { renderId, error } = await renderVideo({
        templateId: template.creatomate_template_id,
        variables: variables,
        platforms: template.platforms,
        metadata: {
          database_job_id: renderJob.id,
          template_id: template.id,
        },
      });
      
      if (error) throw new Error(error);
      
      // Update the render job with the Creatomate render ID
      await supabase
        .from("render_jobs")
        .update({
          creatomate_render_ids: [renderId],
        })
        .eq("id", renderJob.id);
      
      // Show success toast and navigate to projects page
      toast.success("Render job created", {
        description: "Your video is being processed and will be available soon.",
      });
      
      navigate(`/projects?job=${renderJob.id}`);
    } catch (error) {
      console.error("Error submitting render job:", error);
      toast.error("Error creating render", {
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = templateLoading || previewLoading || projectLoading;
  const shouldDisableSubmit = isLoading || isSubmitting || !template;
  
  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isProjectMode ? "Edit Project" : "Customize Template"}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate(isProjectMode ? "/projects" : "/templates")}
        >
          {isProjectMode ? "Back to Projects" : "Back to Templates"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Area */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Preview</h2>
          <Card className="overflow-hidden">
            <TemplatePreview />
          </Card>
        </div>
        
        {/* Variables Editor */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customize</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={resetVariables}
                disabled={isLoading}
              >
                Reset
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={shouldDisableSubmit}
              >
                {isSubmitting ? "Creating..." : "Create Video"}
              </Button>
            </div>
          </div>
          
          <Card className="p-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading variables...</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(variables || {}).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setVariables({ ...variables, [key]: newValue });
                        updatePreview({ ...variables, [key]: newValue });
                      }}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
