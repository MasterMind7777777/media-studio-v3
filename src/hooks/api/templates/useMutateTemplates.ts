
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types";
import { Json } from "@/integrations/supabase/types";
import { transformTemplateData } from "./transformers";
import { getTemplatePreviewImage } from "@/hooks/templates";

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

      // If preview_image_url is not provided and we have a template with variables,
      // try to extract a preview image from the variables
      if (!updateData.preview_image_url && template.variables) {
        const extractedPreview = getTemplatePreviewImage({...template, id});
        if (extractedPreview && extractedPreview !== '/placeholder.svg') {
          updateData.preview_image_url = extractedPreview;
          console.log(`Auto-extracted preview image for template ${id}: ${extractedPreview}`);
        }
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

/**
 * Hook to update template preview images in bulk
 */
export const useUpdateTemplatePreviewBulk = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // 1. Get all templates without preview images
      const { data: templates, error } = await supabase
        .from("templates")
        .select("id, variables, preview_image_url")
        .is("preview_image_url", null)
        .order("created_at", { ascending: false });
        
      if (error) {
        throw new Error(`Error fetching templates: ${error.message}`);
      }

      // 2. For each template, extract preview from variables and update
      const updatedCount = { total: 0, success: 0, failed: 0 };
      
      for (const template of templates || []) {
        updatedCount.total++;
        try {
          // Extract a preview URL from template variables
          const fullTemplate = await queryClient.fetchQuery({ 
            queryKey: ["templates", template.id],
            queryFn: async () => {
              const { data, error } = await supabase
                .from("templates")
                .select("*")
                .eq("id", template.id)
                .single();
                
              if (error) throw error;
              return transformTemplateData(data);
            }
          });

          // Try to get the best preview image
          const previewUrl = getTemplatePreviewImage(fullTemplate);
          
          if (previewUrl && previewUrl !== '/placeholder.svg') {
            // Update the template with the extracted preview URL
            const { error: updateError } = await supabase
              .from("templates")
              .update({ preview_image_url: previewUrl })
              .eq("id", template.id);
              
            if (updateError) {
              updatedCount.failed++;
              console.error(`Error updating template ${template.id}: ${updateError.message}`);
            } else {
              updatedCount.success++;
              console.log(`Updated template ${template.id} with preview: ${previewUrl}`);
            }
          } else {
            updatedCount.failed++;
            console.log(`No valid preview found for template ${template.id}`);
          }
        } catch (error) {
          updatedCount.failed++;
          console.error(`Error processing template ${template.id}: ${error}`);
        }
      }
      
      return updatedCount;
    },
    onSuccess: () => {
      // Invalidate templates query to refetch data with new preview images
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
};
