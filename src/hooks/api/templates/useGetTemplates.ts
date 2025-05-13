
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types";
import { transformTemplateData } from "./transformers";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to fetch all templates with improved caching
 */
export const useTemplates = () => {
  const { isAdmin, user } = useAuth();
  
  return useQuery({
    queryKey: ["templates", user?.id],
    queryFn: async () => {
      try {
        console.log("Fetching all templates from API");
        const query = supabase
          .from("templates")
          .select("*");
          
        // For regular users, only fetch active templates
        // For admins, fetch all templates including inactive ones
        if (!isAdmin) {
          query.eq("is_active", true);
        }
        
        const { data, error } = await query;
          
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (increased from 1 minute)
    refetchOnWindowFocus: false, // Avoid refetching on window focus to prevent flashing
    refetchOnMount: true, // Changed from "if-stale" to true
  });
};

/**
 * Hook to fetch a single template by ID with improved error handling and logging
 */
export const useTemplate = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["templates", id, user?.id],
    queryFn: async () => {
      if (!id) {
        console.error("Template ID is missing");
        throw new Error("Template ID is required");
      }
      
      console.log(`Looking for template with ID: ${id}`);
      
      try {
        // First try to get it from the cache
        const templates = queryClient.getQueryData<Template[]>(["templates", user?.id]);
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
        
        return transformedTemplate;
      } catch (error) {
        console.error("Error in useTemplate:", error);
        throw error;
      }
    },
    enabled: !!id && !!user,
    retry: 1, // Only retry once to avoid excessive retries for non-existent templates
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (increased from 1 minute)
    refetchOnWindowFocus: false, // Avoid refetching on window focus
    refetchOnMount: true, // Changed from "if-stale" to true
  });
};
