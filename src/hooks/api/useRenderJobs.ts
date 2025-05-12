
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RenderJob, Platform } from "@/types";
import { startRenderJob, checkRenderStatus } from "@/services/creatomate";

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
      
      return data as RenderJob[];
    }
  });
};

/**
 * Hook to fetch a single render job by ID
 */
export const useRenderJob = (id: string | undefined) => {
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
      
      return data as RenderJob;
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
      // Start the render job with Creatomate
      const renderIds = await startRenderJob(templateId, variables, platforms);
      
      // Create a record in the render_jobs table
      const { data, error } = await supabase
        .from("render_jobs")
        .insert([{
          template_id: templateId,
          variables,
          platforms,
          status: 'pending',
          creatomate_render_ids: renderIds,
          output_urls: {}
        }])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating render job: ${error.message}`);
      }
      
      return data as RenderJob;
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
      const { data, error } = await supabase
        .from("render_jobs")
        .update(renderJob)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating render job: ${error.message}`);
      }
      
      return data as RenderJob;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific render job query and list
      queryClient.invalidateQueries({ queryKey: ["renderJobs", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["renderJobs"] });
    }
  });
};

/**
 * Hook to check render status and update job
 */
export const useCheckRenderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (renderJob: RenderJob) => {
      if (!renderJob.creatomate_render_ids || renderJob.creatomate_render_ids.length === 0) {
        throw new Error("No render IDs to check");
      }
      
      // Check status with Creatomate
      const statusMap = await checkRenderStatus(renderJob.creatomate_render_ids);
      
      // Determine overall status
      let overallStatus = 'pending';
      const completedCount = Object.values(statusMap).filter(s => s.status === 'completed').length;
      const failedCount = Object.values(statusMap).filter(s => s.status === 'failed').length;
      
      if (completedCount === renderJob.creatomate_render_ids.length) {
        overallStatus = 'completed';
      } else if (failedCount > 0) {
        overallStatus = 'failed';
      } else {
        overallStatus = 'processing';
      }
      
      // Update output URLs for completed renders
      const outputUrls: Record<string, string> = {};
      Object.entries(statusMap).forEach(([id, info]) => {
        if (info.status === 'completed' && info.url) {
          outputUrls[id] = info.url;
        }
      });
      
      // Update the render job in the database
      const { data, error } = await supabase
        .from("render_jobs")
        .update({
          status: overallStatus,
          output_urls: {...renderJob.output_urls, ...outputUrls},
          updated_at: new Date().toISOString()
        })
        .eq("id", renderJob.id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating render job status: ${error.message}`);
      }
      
      return data as RenderJob;
    },
    onSuccess: (data) => {
      // Invalidate specific render job query and list
      queryClient.invalidateQueries({ queryKey: ["renderJobs", data.id] });
      queryClient.invalidateQueries({ queryKey: ["renderJobs"] });
    }
  });
};
