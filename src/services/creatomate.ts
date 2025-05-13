import { Template, RenderJob } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { isImageUrl, isAudioUrl } from "@/lib/utils";

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
        curlCommand,
        include_preview: true // Signal to include preview_url in the response
      },
    });
    
    if (error) {
      throw new Error(`Error importing template: ${error.message}`);
    }
    
    // If the response includes a preview_url but no preview_image_url, set it
    // First validate that it's an image URL, not an audio file
    if (data) {
      let previewUrl = null;
      
      // Check for preview_url first
      if (data.preview_url && isImageUrl(data.preview_url) && !isAudioUrl(data.preview_url)) {
        previewUrl = data.preview_url;
      } 
      // Then try snapshot_url
      else if (data.snapshot_url && isImageUrl(data.snapshot_url) && !isAudioUrl(data.snapshot_url)) {
        previewUrl = data.snapshot_url;
      }
      
      if (previewUrl && !data.preview_image_url) {
        data.preview_image_url = previewUrl;
        console.log(`Using ${previewUrl} as preview image for imported template`);
      }
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
  platforms: any[],
  database_job_id?: string // Add optional parameter for database job ID
): Promise<string[]> {
  try {
    if (!creatomateTemplateId) {
      throw new Error("Creatomate template ID is required");
    }
    
    // For debugging
    console.log("Starting render job with Creatomate template ID:", creatomateTemplateId);
    console.log("Variables:", variables);
    console.log("Platforms:", platforms);
    console.log("Database job ID:", database_job_id);

    // Clean variables (remove any duplicated keys)
    const cleanVariables = cleanupVariables(variables);

    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Use the consistent parameter name "creatomateTemplateId"
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: { 
        action: 'start-render',
        creatomateTemplateId: creatomateTemplateId,
        variables: cleanVariables,
        platforms,
        user_id: user.id, // Pass user ID to the edge function
        database_job_id, // Pass database job ID if provided
        include_snapshots: true // Request snapshots from Creatomate for previews
      },
    });
    
    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Error starting render: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Invalid response from Creatomate edge function");
    }
    
    // The structure is now { renders: [...] } with an array of render objects
    if (data.renders && Array.isArray(data.renders)) {
      // Extract render IDs from all render objects
      return data.renders.map((render: any) => render.id);
    } else if (data.renderIds && Array.isArray(data.renderIds)) {
      // Backwards compatibility with old response format
      return data.renderIds;
    } else {
      console.error("Unexpected response format:", data);
      throw new Error("Invalid response format from Creatomate edge function");
    }
  } catch (error) {
    console.error('Error starting render job:', error);
    throw error;
  }
}

/**
 * Renders a video using the Creatomate API
 */
export const renderVideo = async ({
  templateId,
  variables,
  platforms,
  metadata
}: {
  templateId: string;
  variables: Record<string, any>;
  platforms: any[];
  metadata?: Record<string, any>;
}) => {
  try {
    // Call the Supabase Edge Function to render the video
    const { data, error: supabaseError } = await supabase.functions.invoke('creatomate', {
      body: {
        templateId,
        variables,
        platforms,
        metadata
      }
    });

    if (supabaseError) {
      console.error("Error calling creatomate edge function:", supabaseError);
      return { 
        renderId: null,
        error: supabaseError.message
      };
    }

    return { 
      renderId: data.renderId,
      error: null
    };
  } catch (error) {
    console.error("Error rendering video:", error);
    return { 
      renderId: null,
      error: (error as Error).message
    };
  }
};

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
 * Updates preview images for templates by scanning variables or output URLs
 */
export async function updateTemplatePreviews(): Promise<{
  total: number;
  success: number;
  failed: number;
  skipped: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('creatomate', {
      body: {
        action: 'update-template-previews',
        validate_images: true // New flag to ensure only valid images are used
      }
    });
    
    if (error) {
      throw new Error(`Error updating template previews: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating template previews:', error);
    throw error;
  }
}
