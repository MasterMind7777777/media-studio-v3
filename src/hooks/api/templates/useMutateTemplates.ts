
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types";
import { Json } from "@/integrations/supabase/types";
import { transformTemplateData } from "./transformers";

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
