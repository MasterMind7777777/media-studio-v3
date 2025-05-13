
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startRenderJob } from "@/services/creatomate";

/**
 * Hook to create a new render job
 */
export const useCreateRenderJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      variables,
      platforms
    }: {
      templateId: string;
      variables: Record<string, any>;
      platforms: any[];
    }) => {
      try {
        console.log("Creating render job for template:", templateId);
        
        // First, get the Creatomate template ID from our database
        const { data: template, error: templateError } = await supabase
          .from("templates")
          .select("creatomate_template_id")
          .eq("id", templateId)
          .single();
        
        if (templateError || !template) {
          throw new Error(`Error fetching template: ${templateError?.message || "Template not found"}`);
        }
        
        const creatomateTemplateId = template.creatomate_template_id;
        if (!creatomateTemplateId) {
          throw new Error("Template has no Creatomate template ID");
        }
        
        // Create a new render job in our database
        const { data: job, error: jobError } = await supabase
          .from("render_jobs")
          .insert({
            template_id: templateId,
            variables: variables,
            platforms: platforms,
            status: "pending",
          })
          .select()
          .single();
        
        if (jobError || !job) {
          throw new Error(`Error creating render job: ${jobError?.message || "Unknown error"}`);
        }
        
        // Start the actual render in Creatomate
        const renderIds = await startRenderJob(
          creatomateTemplateId,
          variables,
          platforms,
          job.id // Pass the job ID to track in webhook
        );
        
        // Update the job with render IDs
        await supabase
          .from("render_jobs")
          .update({
            render_ids: renderIds,
            status: "processing"
          })
          .eq("id", job.id);
        
        // Return the job data
        return job;
      } catch (error: any) {
        console.error("Error creating render job:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate render jobs queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["render_jobs"] });
    }
  });
};
