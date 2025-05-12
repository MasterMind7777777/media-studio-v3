
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types";
import { transformTemplateData } from "./transformers";

/**
 * Hook to fetch all templates with improved caching
 */
export const useTemplates = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      try {
        console.log("Fetching all templates from API");
        const { data, error } = await supabase
          .from("templates")
          .select("*")
          .eq("is_active", true);
          
        if (error) {
          throw new Error(`Error fetching templates: ${error.message}`);
        }
        
        // Transform the data to match the expected Template type
        const transformedData = (data || []).map(item => transformTemplateData(item));
        console.log(`Fetched ${transformedData.length} templates successfully`);
        return transformedData;
      } catch (error) {
        console.error("Error in useTemplates:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to improve performance
  });
};

/**
 * Hook to fetch a single template by ID with improved error handling and logging
 */
export const useTemplate = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["templates", id],
    queryFn: async () => {
      if (!id) {
        console.error("Template ID is missing");
        throw new Error("Template ID is required");
      }
      
      console.log(`Looking for template with ID: ${id}`);
      
      try {
        // First try to get it from the cache
        const templates = queryClient.getQueryData<Template[]>(["templates"]);
        console.log(`Checking cache for templates. Found: ${templates ? templates.length : 0} templates`);
        
        if (templates && templates.length > 0) {
          const cachedTemplate = templates.find(t => t.id === id);
          if (cachedTemplate) {
            console.log(`Found template "${cachedTemplate.name}" in cache`);
            return cachedTemplate;
          } else {
            console.log(`Template with ID ${id} not found in cache of ${templates.length} templates`);
          }
        }
        
        // If not in cache, fetch from API
        console.log(`Fetching template ${id} from API`);
        const { data, error } = await supabase
          .from("templates")
          .select("*")
          .eq("id", id)
          .maybeSingle();
          
        if (error) {
          console.error(`API error fetching template: ${error.message}`);
          throw new Error(`Error fetching template: ${error.message}`);
        }
        
        if (!data) {
          console.error(`Template with ID ${id} not found in database`);
          throw new Error(`Template not found with ID: ${id}`);
        }
        
        // Transform the data to match the expected Template type
        const transformedTemplate = transformTemplateData(data);
        console.log(`Successfully fetched template "${transformedTemplate.name}" from API`);
        
        // Update the cache with this template
        if (templates) {
          queryClient.setQueryData(["templates"], 
            templates.some(t => t.id === transformedTemplate.id) 
              ? templates.map(t => t.id === transformedTemplate.id ? transformedTemplate : t)
              : [...templates, transformedTemplate]
          );
        } else {
          queryClient.setQueryData(["templates"], [transformedTemplate]);
        }
        
        return transformedTemplate;
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
