
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
    mutationFn: async (updateData: Partial<Template> & { id: string }) => {
      // Ensure we have the required name field if this is a full template update
      if (updateData.name === undefined) {
        // Fetch the current template to get its name
        const { data: currentTemplate, error: fetchError } = await supabase
          .from("templates")
          .select("name")
          .eq("id", updateData.id)
          .single();
          
        if (fetchError) {
          throw new Error(`Error fetching template: ${fetchError.message}`);
        }
        
        // Add the current name to our update data
        updateData.name = currentTemplate.name;
      }
      
      // Prepare the template data for Supabase
      const supabaseUpdateData: any = { ...updateData };
      
      // Convert complex objects to Json for Supabase
      if (updateData.platforms) {
        supabaseUpdateData.platforms = updateData.platforms as unknown as Json;
      }
      if (updateData.variables) {
        supabaseUpdateData.variables = updateData.variables as unknown as Json;
      }

      // If preview_image_url is not provided and we have a template with variables,
      // try to extract a preview image from the variables
      if (!supabaseUpdateData.preview_image_url && updateData.variables) {
        const fullTemplate = { ...updateData, id: updateData.id } as Template;
        const extractedPreview = getTemplatePreviewImage(fullTemplate);
        if (extractedPreview && extractedPreview !== '/placeholder.svg') {
          supabaseUpdateData.preview_image_url = extractedPreview;
          console.log(`Auto-extracted preview image for template ${updateData.id}: ${extractedPreview}`);
        }
      }

      const { data, error } = await supabase
        .from("templates")
        .update(supabaseUpdateData)
        .eq("id", updateData.id)
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
