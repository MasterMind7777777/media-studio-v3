
import { Template, RenderJob } from "@/types";

// This API key would be better handled by a Supabase Edge Function in production
const API_KEY = "YOUR_CREATOMATE_API_KEY"; // Replace with actual API key

/**
 * Fetches templates from Creatomate API
 */
export async function fetchCreatomateTemplates(): Promise<any[]> {
  try {
    const response = await fetch('https://api.creatomate.com/v1/templates', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Creatomate templates:', error);
    throw error;
  }
}

/**
 * Imports a template from Creatomate to our database
 */
export async function importCreatomateTemplate(templateId: string): Promise<Template> {
  try {
    // Fetch template details from Creatomate
    const response = await fetch(`https://api.creatomate.com/v1/templates/${templateId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template details: ${response.statusText}`);
    }
    
    const templateData = await response.json();
    
    // Extract platforms (resolutions) from the template
    const platforms = templateData.outputs.map((output: any) => ({
      name: output.name || `${output.width}x${output.height}`,
      width: output.width,
      height: output.height,
      aspect_ratio: `${output.width}:${output.height}`
    }));
    
    // Extract variables from the template
    const variables = templateData.elements.reduce((acc: Record<string, any>, element: any) => {
      if (element.properties && element.properties.text) {
        acc[element.name] = {
          type: 'text',
          default: element.properties.text,
          value: element.properties.text
        };
      } else if (element.properties && element.properties.source) {
        acc[element.name] = {
          type: 'media',
          default: element.properties.source,
          value: element.properties.source
        };
      }
      return acc;
    }, {});
    
    // Transform the template data to our format
    const template: Template = {
      id: templateData.id,
      name: templateData.name,
      description: templateData.description || `Template for ${platforms.map((p: any) => p.name).join(', ')}`,
      preview_image_url: templateData.preview_url || '',
      creatomate_template_id: templateData.id,
      variables,
      platforms,
      category: 'Imported',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    return template;
  } catch (error) {
    console.error('Error importing Creatomate template:', error);
    throw error;
  }
}

/**
 * Starts a render job with Creatomate
 */
export async function startRenderJob(
  templateId: string, 
  variables: Record<string, any>,
  platforms: any[]
): Promise<string[]> {
  try {
    // Create render configurations for each platform
    const renders = platforms.map(platform => ({
      template_id: templateId,
      output_format: 'mp4',
      width: platform.width,
      height: platform.height,
      modifications: variables
    }));
    
    // Send render request to Creatomate
    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        renders
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start render: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the render IDs
    return data.renders.map((render: any) => render.id);
  } catch (error) {
    console.error('Error starting render job:', error);
    throw error;
  }
}

/**
 * Check status of a render job
 */
export async function checkRenderStatus(renderIds: string[]): Promise<Record<string, any>> {
  try {
    const statusPromises = renderIds.map(async (renderId) => {
      const response = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check render status: ${response.statusText}`);
      }
      
      return response.json();
    });
    
    const results = await Promise.all(statusPromises);
    
    // Create a map of render IDs to their status and output URLs
    const statusMap: Record<string, any> = {};
    results.forEach((result) => {
      statusMap[result.id] = {
        status: result.status,
        url: result.url || null,
        progress: result.progress || 0
      };
    });
    
    return statusMap;
  } catch (error) {
    console.error('Error checking render status:', error);
    throw error;
  }
}
