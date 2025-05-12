
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types";

// Helper function to transform template data from Supabase
const transformTemplateData = (item: any): Template => ({
  ...item,
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
});

/**
 * Hook to fetch all templates
 */
export const useTemplates = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("is_active", true);
        
      if (error) {
        throw new Error(`Error fetching templates: ${error.message}`);
      }
      
      // Transform the data to match the expected Template type
      return (data || []).map(item => transformTemplateData(item));
    }
  });
};

/**
 * Hook to fetch a single template by ID
 */
export const useTemplate = (id: string | undefined) => {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: async () => {
      if (!id) throw new Error("Template ID is required");
      
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
    },
    enabled: !!id
  });
};

/**
 * Hook to create a new template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<Template, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("templates")
        .insert([template])
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
      const { data, error } = await supabase
        .from("templates")
        .update(template)
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
