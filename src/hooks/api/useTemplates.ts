
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types";
import { Json } from "@/integrations/supabase/types";

// Helper function to transform template data from Supabase
const transformTemplateData = (item: any): Template => ({
  id: item.id,
  name: item.name,
  description: item.description || '',
  preview_image_url: item.preview_image_url || '',
  creatomate_template_id: item.creatomate_template_id,
  // Transform platforms from Json to Platform[] type
  platforms: Array.isArray(item.platforms)
    ? item.platforms.map((platform: any) => ({
        id: platform.id || '',
        name: platform.name || '',
        width: platform.width || 0,
        height: platform.height || 0,
        aspect_ratio: platform.aspect_ratio || '1:1'
      }))
    : [],
  // Ensure variables is a proper Record type
  variables: item.variables || {},
  category: item.category || '',
  is_active: item.is_active !== undefined ? item.is_active : true,
  created_at: item.created_at || new Date().toISOString()
});

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

/**
 * Hook to create a new template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<Template, "id" | "created_at">) => {
      // Prepare the template data for Supabase by converting platform objects to Json
      const supabaseTemplate = {
        name: template.name,
        description: template.description,
        preview_image_url: template.preview_image_url,
        creatomate_template_id: template.creatomate_template_id,
        variables: template.variables as unknown as Json,
        platforms: template.platforms as unknown as Json,
        category: template.category,
        is_active: template.is_active
      };

      const { data, error } = await supabase
        .from("templates")
        .insert([supabaseTemplate])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating template: ${error.message}`);
      }
      
      return transformTemplateData(data);
    },
    onSuccess: () => {
      // Invalidate templates query to refetch data
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
};

/**
 * Hook to update a template
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...template }: Partial<Template> & { id: string }) => {
      // Prepare the template data for Supabase
      const updateData: any = { ...template };
      
      if (template.platforms) {
        updateData.platforms = template.platforms as unknown as Json;
      }
      if (template.variables) {
        updateData.variables = template.variables as unknown as Json;
      }

      const { data, error } = await supabase
        .from("templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating template: ${error.message}`);
      }
      
      return transformTemplateData(data);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific template query and templates list
      queryClient.invalidateQueries({ queryKey: ["templates", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
};

/**
 * Hook to delete a template
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", id);
        
      if (error) {
        throw new Error(`Error deleting template: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: (id) => {
      // Remove template from cache and invalidate templates list
      queryClient.removeQueries({ queryKey: ["templates", id] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
};
