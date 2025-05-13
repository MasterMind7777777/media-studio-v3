
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RenderJob } from "@/types";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { transformRenderJobData } from "./templates/transformers";

// Page size for infinite queries
const PAGE_SIZE = 12;

/**
 * Hook to get a single render job by ID
 * @param id - The render job ID to fetch
 */
export const useRenderJob = (id: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["renderJobs", id],
    queryFn: async () => {
      if (!id) throw new Error("No render job ID provided");

      // Try to get it from the cache first
      const cached = queryClient.getQueryData<RenderJob>(["renderJobs", id]);
      if (cached) return cached;

      console.log(`Fetching render job with ID: ${id}`);
      const { data, error } = await supabase
        .from("render_jobs")
        .select("*, templates(*)")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching render job:", error);
        throw new Error(`Error fetching render job: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Render job not found: ${id}`);
      }

      return transformRenderJobData(data);
    },
    enabled: !!id && !!user,
  });
};

/**
 * Hook to fetch all render jobs for the current user with optional real-time updates
 */
export const useRenderJobs = ({ realtime = true } = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ["renderJobs"],
    queryFn: async () => {
      console.log("Fetching render jobs");
      const { data, error } = await supabase
        .from("render_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching render jobs:", error);
        throw new Error(`Error fetching render jobs: ${error.message}`);
      }

      return (data || []).map(transformRenderJobData);
    },
    enabled: !!user,
  });

  // Setup real-time subscription if enabled
  useEffect(() => {
    if (!user || !realtime) return;

    console.log("Setting up render_jobs real-time channel");
    const channel = supabase
      .channel("render_jobs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "render_jobs" },
        (payload) => {
          console.log("Real-time update for render_jobs:", payload);
          queryClient.invalidateQueries({ queryKey: ["renderJobs"] });
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from render_jobs real-time channel");
      supabase.removeChannel(channel);
    };
  }, [user, realtime, queryClient]);

  return result;
};

/**
 * Hook to fetch render jobs with infinite pagination 
 */
export const useInfiniteRenderJobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const result = useInfiniteQuery({
    queryKey: ["renderJobsInfinite"],
    queryFn: async ({ pageParam }) => {
      console.log(`Fetching render jobs page, cursor: ${pageParam || "initial"}`);
      
      let query = supabase
        .from("render_jobs")
        .select("*, templates(name)")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      
      if (pageParam) {
        // Use cursor-based pagination with created_at
        query = query.lt("created_at", pageParam);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching render jobs:", error);
        throw new Error(`Error fetching render jobs: ${error.message}`);
      }

      const transformedData = (data || []).map(transformRenderJobData);
      
      return {
        data: transformedData,
        cursor: data.length > 0 ? data[data.length - 1].created_at : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!user,
  });

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log("Setting up render_jobs real-time channel for infinite query");
    const channel = supabase
      .channel("render_jobs_infinite_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "render_jobs" },
        (payload) => {
          console.log("Real-time update for infinite render_jobs:", payload);
          
          // If it's an INSERT or UPDATE event, we need to invalidate the query
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            queryClient.invalidateQueries({ queryKey: ["renderJobsInfinite"] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from render_jobs real-time channel for infinite query");
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return result;
};
