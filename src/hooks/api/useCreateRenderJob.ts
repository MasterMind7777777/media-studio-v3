
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startRenderJob } from "@/services/creatomate";
import { Platform } from "@/types";

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
      platforms: Platform[];
    }) => {
      try {
        console.log("Creating render job for template:", templateId);
        console.log("Selected platforms:", platforms);
        
        if (!platforms || platforms.length === 0) {
          throw new Error("No platforms selected for rendering");
        }
        
        // Validate that each platform has the required properties
        platforms.forEach((platform, index) => {
          if (!platform.id) {
            throw new Error(`Platform at index ${index} is missing an id`);
          }
          if (!platform.name) {
            throw new Error(`Platform ${platform.id} is missing a name`);
          }
          if (!platform.width || typeof platform.width !== 'number') {
            throw new Error(`Platform ${platform.id} has an invalid width`);
          }
          if (!platform.height || typeof platform.height !== 'number') {
            throw new Error(`Platform ${platform.id} has an invalid height`);
          }
        });
        
        // First, get the Creatomate template ID from our database
        const { data: template, error: templateError } = await supabase
          .from("templates")
          .select("creatomate_template_id")
          .eq("id", templateId)
          .maybeSingle();
        
        if (templateError) {
          throw new Error(`Error fetching template: ${templateError.message}`);
        }
        
        if (!template) {
          throw new Error("Template not found");
        }
        
        const creatomateTemplateId = template.creatomate_template_id;
        if (!creatomateTemplateId) {
          throw new Error("Template has no Creatomate template ID");
        }
        
        // Get the current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        // Create a new render job in our database
        const { data: job, error: jobError } = await supabase
          .from("render_jobs")
          .insert({
            template_id: templateId,
            variables: variables,
            platforms: platforms,
            status: "pending",
            user_id: user.id
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
            creatomate_render_ids: renderIds,
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
