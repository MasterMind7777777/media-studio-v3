
import { Template, RenderJob, Platform } from "@/types";
import { Json } from "@/integrations/supabase/types";

/**
 * Helper function to transform template data from Supabase
 */
export const transformTemplateData = (item: any): Template => ({
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
 * Helper function to transform render job data from Supabase
 */
export const transformRenderJobData = (item: any): RenderJob => ({
  id: item.id,
  user_id: item.user_id,
  template_id: item.template_id,
  name: item.name || null,
  variables: item.variables || {},
  platforms: Array.isArray(item.platforms)
    ? item.platforms.map((platform: any) => ({
        id: platform.id || '',
        name: platform.name || '',
        width: platform.width || 0,
        height: platform.height || 0,
        aspect_ratio: platform.aspect_ratio || '1:1'
      }))
    : [],
  status: item.status || 'pending',
  creatomate_render_ids: Array.isArray(item.creatomate_render_ids) ? item.creatomate_render_ids : [],
  output_urls: item.output_urls || {},
  snapshot_url: item.snapshot_url || null,
  created_at: item.created_at,
  updated_at: item.updated_at || item.created_at,
  templates: item.templates ? transformTemplateData(item.templates) : undefined
});
