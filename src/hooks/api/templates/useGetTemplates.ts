
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types";
import { transformTemplateData } from "./transformers";

/**
 * Hook to fetch all templates
 */
export const useTemplates = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("templates")
          .select("*")
          .eq("is_active", true);
          
        if (error) {
          throw new Error(`Error fetching templates: ${error.message}`);
        }
        
        // Transform the data to match the expected Template type
        return (data || []).map(item => transformTemplateData(item));
      } catch (error) {
        console.error("Error in useTemplates:", error);
        throw error;
      }
    }
  });
};

/**
 * Hook to fetch a single template by ID
 */
export const useTemplate = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["templates", id],
    queryFn: async () => {
      if (!id) throw new Error("Template ID is required");
      
      try {
        // First try to get it from the cache
        const templates = queryClient.getQueryData<Template[]>(["templates"]);
        const cachedTemplate = templates?.find(t => t.id === id);
        
        if (cachedTemplate) {
          return cachedTemplate;
        }
        
        // If not in cache, fetch from API
        const { data, error } = await supabase
          .from("templates")
          .select("*")
          .eq("id", id)
          .maybeSingle();
          
        if (error) {
          throw new Error(`Error fetching template: ${error.message}`);
        }
        
        if (!data) {
          throw new Error(`Template not found with ID: ${id}`);
        }
        
        // Transform the data to match the expected Template type
        return transformTemplateData(data);
      } catch (error) {
        console.error("Error in useTemplate:", error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1, // Only retry once to avoid excessive retries for non-existent templates
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
