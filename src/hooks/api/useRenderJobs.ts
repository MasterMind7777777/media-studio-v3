
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RenderJob, Platform } from "@/types";
import { startRenderJob } from "@/services/creatomate";
import { Json } from "@/integrations/supabase/types";
import { useEffect } from "react";

// Define status mapping from Creatomate to our database status values
const mapCreatomateStatus = (status: string): 'pending' | 'processing' | 'completed' | 'failed' => {
  const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
    'planned': 'pending',
    'waiting': 'pending',
    'transcribing': 'processing',
    'rendering': 'processing',
    'succeeded': 'completed',
    'failed': 'failed'
  };
  
  return statusMap[status] || 'pending'; // Default to 'pending' for unknown statuses
};

// Helper function to transform render job data from Supabase
const transformRenderJobData = (item: any): RenderJob => ({
  id: item.id,
  user_id: item.user_id,
  template_id: item.template_id,
  variables: item.variables || {},
  platforms: Array.isArray(item.platforms) ? item.platforms.map((platform: any) => ({
    id: platform.id || '',
    name: platform.name || '',
    width: platform.width || 0,
    height: platform.height || 0,
    aspect_ratio: platform.aspect_ratio || '1:1'
  })) : [],
  status: item.status || 'pending',
  creatomate_render_ids: item.creatomate_render_ids || [],
  output_urls: item.output_urls || {},
  created_at: item.created_at,
  updated_at: item.updated_at
});

/**
 * Hook to fetch all render jobs
 */
export const useRenderJobs = () => {
  return useQuery({
    queryKey: ["renderJobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("render_jobs")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        throw new Error(`Error fetching render jobs: ${error.message}`);
      }
      
      return (data || []).map(item => transformRenderJobData(item));
    }
  });
};

/**
 * Hook to fetch a single render job by ID
 */
export const useRenderJob = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  // Set up a realtime subscription for this render job
  useEffect(() => {
    if (!id) return;
    
    // Subscribe to changes for this particular render job
    const channel = supabase
      .channel(`render_job_${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'render_jobs',
        filter: `id=eq.${id}`
      }, (payload) => {
        // When the job is updated (by the webhook), refresh the data
        queryClient.invalidateQueries({ queryKey: ["renderJobs", id] });
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);
  
  return useQuery({
    queryKey: ["renderJobs", id],
    queryFn: async () => {
      if (!id) throw new Error("Render Job ID is required");
      
      const { data, error } = await supabase
        .from("render_jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
        
      if (error) {
        throw new Error(`Error fetching render job: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Render job not found with ID: ${id}`);
      }
      
      return transformRenderJobData(data);
    },
    enabled: !!id
  });
};

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
      templateId: string, 
      variables: Record<string, any>, 
      platforms: Platform[] 
    }) => {
      // First, fetch the template to get the Creatomate template ID
      const { data: templateData, error: templateError } = await supabase
        .from("templates")
        .select("id, creatomate_template_id, name")
        .eq("id", templateId)
        .maybeSingle();
        
      if (templateError) {
        throw new Error(`Error fetching template: ${templateError.message}`);
      }
      
      if (!templateData) {
        throw new Error(`Template not found with ID: ${templateId}`);
      }
      
      const creatomateTemplateId = templateData.creatomate_template_id;
      
      if (!creatomateTemplateId) {
        throw new Error(`Template "${templateData.name}" doesn't have a valid Creatomate template ID`);
      }

      console.log(`Starting render for template ${templateId} with Creatomate ID: ${creatomateTemplateId}`);
      
      try {
        // Need to get the current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        
        // Start the render job with Creatomate using the creatomate_template_id (not the database ID)
        const renderIds = await startRenderJob(creatomateTemplateId, variables, platforms);
        
        // Create a record in the render_jobs table
        const { data, error } = await supabase
          .from("render_jobs")
          .insert([{
            user_id: user.id,
            template_id: templateId,
            variables: variables as Json,
            platforms: platforms as unknown as Json,
            status: 'pending',  // Changed from 'planned' to 'pending' to match our database constraints
            creatomate_render_ids: renderIds,
            output_urls: {} as Json
          }])
          .select()
          .single();
          
        if (error) {
          throw new Error(`Error creating render job: ${error.message}`);
        }
        
        return transformRenderJobData(data);
      } catch (error) {
        console.error("Failed to start render job:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate render jobs query to refetch data
      queryClient.invalidateQueries({ queryKey: ["renderJobs"] });
    }
  });
};

/**
 * Hook to update a render job
 */
export const useUpdateRenderJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...renderJob }: Partial<RenderJob> & { id: string }) => {
      // Convert Platform[] to Json for Supabase
      const updateData: any = { ...renderJob };
      if (renderJob.platforms) {
        updateData.platforms = renderJob.platforms as unknown as Json;
      }
      if (renderJob.variables) {
        updateData.variables = renderJob.variables as unknown as Json;
      }
      if (renderJob.output_urls) {
        updateData.output_urls = renderJob.output_urls as unknown as Json;
      }

      const { data, error } = await supabase
        .from("render_jobs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating render job: ${error.message}`);
      }
      
      return transformRenderJobData(data);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific render job query and list
      queryClient.invalidateQueries({ queryKey: ["renderJobs", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["renderJobs"] });
    }
  });
};

// Note: The checkRenderStatus hook is now deprecated as we're using webhooks instead
// We'll keep it for backward compatibility but mark it as deprecated
/**
 * @deprecated Use webhook approach instead
 * Hook to check render status and update job
 */
export const useCheckRenderStatus = () => {
  console.warn("useCheckRenderStatus is deprecated. The application now uses webhooks for status updates.");
  
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (renderJob: RenderJob) => {
      // Simply return the render job as is, since webhooks will handle status updates
      return renderJob;
    },
    onSuccess: (data) => {
      // No action needed - webhooks will update the status
    }
  });
};
