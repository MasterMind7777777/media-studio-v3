import { Template, RenderJob } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { isImageUrl, isAudioUrl } from "@/lib/utils";
import { z } from "zod";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { cleanupVariables as cleanupVariablesFromLib } from "@/lib/variables";

/**
 * Zod schema definitions for Creatomate API responses
 */

// Schema for Creatomate Render object
export const RenderSchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'waiting', 'planned', 'transcribing', 'rendering', 'succeeded', 'failed']),
  url: z.string().url().optional(),
  snapshot_url: z.string().url().optional(),
  preview_url: z.string().url().optional(),
  progress: z.number().optional(),
  error_message: z.string().optional(),
  output_format: z.enum(['jpg', 'png', 'gif', 'mp4']).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  metadata: z.string().optional(),
  template_id: z.string().optional(),
  template_name: z.string().optional(),
  created_at: z.string().datetime().optional()
});

// Schema for Creatomate Template object
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  preview_url: z.string().url().optional(),
  snapshot_url: z.string().url().optional(),
  source: z.record(z.any()).optional(),
  elements: z.array(z.record(z.any())).optional(),
  outputs: z.array(z.record(z.any())).optional(),
  width: z.number().optional(),
  height: z.number().optional()
});

// Type definitions derived from schemas
export type CreatomateRender = z.infer<typeof RenderSchema>;
export type CreatomateTemplate = z.infer<typeof TemplateSchema>;

// Parameters for render creation
export interface RenderParams {
  template_id?: string;
  source?: Record<string, any>;
  modifications?: Record<string, any>;
  output_format?: 'jpg' | 'png' | 'gif' | 'mp4';
  width?: number;
  height?: number;
  render_scale?: number;
  max_width?: number;
  max_height?: number;
  webhook_url?: string;
  metadata?: string;
  // Allow for future parameters
  [key: string]: unknown;
}

/**
 * Helper function to clean up variables before sending to Creatomate API
 * @deprecated Use the cleanupVariables from @/lib/variables instead
 */
function cleanupVariablesForApi(variables: Record<string, any>): Record<string, any> {
  // Delegate to the shared implementation
  return cleanupVariablesFromLib(variables);
}

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
  database_job_id?: string
): Promise<string[]> {
  try {
    if (!creatomateTemplateId) {
      throw new Error("Creatomate template ID is required");
    }
    
    if (!platforms || platforms.length === 0) {
      throw new Error("At least one platform must be selected for rendering");
    }
    
    // Validate platform objects before sending to edge function
    const validPlatforms = platforms.map(platform => {
      // Ensure each platform has the required fields
      if (!platform.id || !platform.name || !platform.width || !platform.height) {
        console.error("Invalid platform object:", platform);
        throw new Error(`Invalid platform object: missing required fields`);
      }
      
      // Return a standardized platform object with only the fields we need
      return {
        id: platform.id,
        name: platform.name,
        width: platform.width,
        height: platform.height,
        aspect_ratio: platform.aspect_ratio || `${platform.width}:${platform.height}`
      };
    });
    
    // For debugging
    console.log("Starting render job with Creatomate template ID:", creatomateTemplateId);
    console.log("Variables:", variables);
    console.log("Selected platforms:", validPlatforms);
    console.log("Database job ID:", database_job_id);

    // Clean variables (remove any duplicated keys) - use the imported function from /lib
    const cleanVariables = cleanupVariablesFromLib(variables);

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
        platforms: validPlatforms, // Send the validated platforms
        user_id: user.id,
        database_job_id,
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
    
    console.log("Edge function response:", data);
    
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
