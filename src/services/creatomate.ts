
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
export async function importCreatomateTemplate(templateId: string, curlCommand?: string): Promise<Template> {
  try {
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: { 
        action: 'import-template',
        templateId,
        curlCommand 
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
 * Parses a CURL command to extract template ID and modifications
 */
export async function parseCurlCommand(curlCommand: string): Promise<{
  templateId: string | null;
  modifications: Record<string, any>;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: {
        action: 'parse-curl',
        curlCommand
      },
    });
    
    if (error) {
      throw new Error(`Error parsing CURL command: ${error.message}`);
    }
    
    return {
      templateId: data.templateId || null,
      modifications: data.modifications || {}
    };
  } catch (error) {
    console.error('Error parsing CURL command:', error);
    throw error;
  }
}

/**
 * Starts a render job with Creatomate via secure Edge Function
 * This function expects the Creatomate template ID, NOT the database template ID
 */
export async function startRenderJob(
  creatomateTemplateId: string, 
  variables: Record<string, any>,
  platforms: any[]
): Promise<string[]> {
  try {
    if (!creatomateTemplateId) {
      throw new Error("Creatomate template ID is required");
    }
    
    // For debugging
    console.log("Starting render job with Creatomate template ID:", creatomateTemplateId);
    console.log("Variables:", variables);
    console.log("Platforms:", platforms);

    // Clean variables (remove any duplicated keys)
    const cleanVariables = cleanupVariables(variables);

    // Use the correct field name for template_id expected by the edge function
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: { 
        action: 'start-render',
        template_id: creatomateTemplateId, // Use template_id key for consistency with edge function
        variables: cleanVariables,
        platforms 
      },
    });
    
    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Error starting render: ${error.message}`);
    }
    
    if (!data || !data.renderIds) {
      throw new Error("Invalid response from Creatomate edge function");
    }
    
    return data.renderIds;
  } catch (error) {
    console.error('Error starting render job:', error);
    throw error;
  }
}

/**
 * Helper function to clean up variables before sending to Creatomate API
 */
function cleanupVariables(variables: Record<string, any>): Record<string, any> {
  const cleanVars: Record<string, any> = {};
  
  // Process each variable to ensure we don't have duplicated keys
  Object.entries(variables).forEach(([key, value]) => {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      return;
    }
    
    // Fix duplicated suffixes (like .text.text becoming just .text)
    const suffixes = ['.text', '.fill', '.source'];
    
    let cleanKey = key;
    suffixes.forEach(suffix => {
      // Check if key has duplicate suffixes (e.g., "Heading.text.text")
      const regex = new RegExp(`(${suffix.replace('.', '\\.')})+$`);
      if (regex.test(key)) {
        cleanKey = key.replace(regex, suffix);
      }
    });
    
    // Store with clean key
    cleanVars[cleanKey] = value;
  });
  
  return cleanVars;
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
