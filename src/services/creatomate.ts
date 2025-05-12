
import { Template, RenderJob } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches templates from Creatomate via our secure Edge Function
 */
export async function fetchCreatomateTemplates(): Promise<any[]> {
  try {
    // This would call our edge function if implemented
    // For now, we'll use the Supabase database directly
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("is_active", true);
      
    if (error) {
      throw new Error(`Error fetching templates: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching Creatomate templates:', error);
    throw error;
  }
}

/**
 * Imports a template from Creatomate to our database via secure Edge Function
 */
export async function importCreatomateTemplate(templateId: string): Promise<Template> {
  try {
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: { 
        action: 'import-template',
        templateId 
      },
    });
    
    if (error) {
      throw new Error(`Error importing template: ${error.message}`);
    }
    
    return data as Template;
  } catch (error) {
    console.error('Error importing Creatomate template:', error);
    throw error;
  }
}

/**
 * Starts a render job with Creatomate via secure Edge Function
 */
export async function startRenderJob(
  templateId: string, 
  variables: Record<string, any>,
  platforms: any[]
): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: { 
        action: 'start-render',
        templateId,
        variables,
        platforms 
      },
    });
    
    if (error) {
      throw new Error(`Error starting render: ${error.message}`);
    }
    
    return data.renderIds;
  } catch (error) {
    console.error('Error starting render job:', error);
    throw error;
  }
}

/**
 * Check status of a render job via secure Edge Function
 */
export async function checkRenderStatus(renderIds: string[]): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: { 
        action: 'check-render',
        renderIds 
      },
    });
    
    if (error) {
      throw new Error(`Error checking render status: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error checking render status:', error);
    throw error;
  }
}
