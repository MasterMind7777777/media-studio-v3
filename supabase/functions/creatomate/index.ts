
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  corsHeaders, 
  errorResponse, 
  successResponse, 
  cleanupVariables,
  normalizePlatform,
  getTemplate,
  startRender,
  getRender
} from "../_shared/creatomate-api.ts";

// Create a Supabase client for database operations
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`Processing ${action} action with params:`, JSON.stringify(params));

    switch (action) {
      case 'import-template':
        return await handleImportTemplate(params);
      case 'parse-curl':
        return await handleParseCurl(params);
      case 'start-render':
        return await handleStartRender(params);
      case 'update-template-previews':
        return await handleUpdateTemplatePreviews(params);
      default:
        return errorResponse(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return errorResponse(`Error processing request: ${error.message}`, 500);
  }
});

// Handler for importing a template from Creatomate
async function handleImportTemplate({ templateId, curlCommand, include_preview = false }) {
  try {
    if (!templateId && !curlCommand) {
      return errorResponse('Either templateId or curlCommand must be provided');
    }
    
    // If we have a curl command but no template ID, try to extract it
    if (!templateId && curlCommand) {
      const parsedCurl = await handleParseCurl({ curlCommand });
      const parsedData = await parsedCurl.json();
      templateId = parsedData.templateId;
      
      if (!templateId) {
        return errorResponse('Could not extract template ID from curl command');
      }
    }
    
    // Fetch the template from Creatomate API
    const template = await getTemplate(templateId);
    
    if (!template) {
      return errorResponse(`Template not found with ID: ${templateId}`);
    }
    
    // Format the template data for our database
    const templateData = {
      name: template.name || `Template ${templateId.substring(0, 8)}`,
      description: template.description || '',
      creatomate_template_id: templateId,
      preview_image_url: include_preview ? (template.preview_url || template.snapshot_url) : null,
      platforms: template.outputs ? template.outputs.map(output => ({
        id: `platform_${output.width}x${output.height}`,
        name: `${output.width}x${output.height}`,
        width: output.width,
        height: output.height,
        aspect_ratio: `${output.width}:${output.height}`
      })) : [],
      variables: template.source || {},
      is_active: true
    };
    
    // Store the template in our database
    const { data, error } = await supabaseClient
      .from('templates')
      .insert([templateData])
      .select()
      .single();
      
    if (error) {
      console.error('Error storing template in database:', error);
      return errorResponse(`Error storing template: ${error.message}`);
    }
    
    return successResponse(data);
  } catch (error) {
    console.error('Error importing template:', error);
    return errorResponse(`Error importing template: ${error.message}`, 500);
  }
}

// Handler for parsing a curl command to extract template ID and modifications
async function handleParseCurl({ curlCommand }) {
  try {
    if (!curlCommand) {
      return errorResponse('curlCommand parameter is required');
    }
    
    let templateId = null;
    let modifications = {};
    
    // Extract template_id pattern
    const templateIdMatch = curlCommand.match(/template_id['":\s]+([0-9a-f-]+)/i);
    if (templateIdMatch && templateIdMatch[1]) {
      templateId = templateIdMatch[1];
    }
    
    // Try to extract a modifications object
    try {
      const modificationsMatch = curlCommand.match(/modifications['":\s]+(\{[^}]+\})/i);
      if (modificationsMatch && modificationsMatch[1]) {
        // This is a simplistic approach - for a production app, use a proper JSON parser
        const modString = modificationsMatch[1].replace(/(['"])?([a-z0-9A-Z_.]+)(['"])?:/g, '"$2":');
        modifications = JSON.parse(modString.replace(/'/g, '"'));
      }
    } catch (e) {
      console.warn('Failed to parse modifications from curl command:', e);
    }
    
    return successResponse({ templateId, modifications });
  } catch (error) {
    console.error('Error parsing curl command:', error);
    return errorResponse(`Error parsing curl command: ${error.message}`, 500);
  }
}

// Handler for starting a render job
async function handleStartRender({ 
  creatomateTemplateId, 
  variables,
  platforms,
  user_id,
  database_job_id,
  include_snapshots = true
}) {
  try {
    // Validate required parameters
    if (!creatomateTemplateId) {
      return errorResponse('creatomateTemplateId is required');
    }
    
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return errorResponse('At least one platform must be specified');
    }
    
    // Clean up and standardize the variables
    const cleanedVariables = cleanupVariables(variables || {});
    
    // Prepare render requests for each platform
    const renderRequests = platforms.map(platform => {
      // Ensure platform has standard format
      const normalizedPlatform = normalizePlatform(platform);
      
      return {
        template_id: creatomateTemplateId,
        modifications: cleanedVariables,
        output_format: 'mp4',
        width: normalizedPlatform.width,
        height: normalizedPlatform.height,
        metadata: database_job_id ? `job_id:${database_job_id}|platform:${normalizedPlatform.id}` : '',
        webhook_url: `${Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')}/functions/v1/creatomate-webhook`
      };
    });
    
    // Start the renders
    const renders = await startRender(renderRequests);
    
    // Return the render IDs and information
    return successResponse({
      renders,
      renderIds: renders.map(render => render.id)
    });
  } catch (error) {
    console.error('Error starting render:', error);
    return errorResponse(`Error starting render: ${error.message}`, 500);
  }
}

// Handler for updating template previews
async function handleUpdateTemplatePreviews({ validate_images = false }) {
  try {
    // Get all templates from the database
    const { data: templates, error } = await supabaseClient
      .from('templates')
      .select('*');
      
    if (error) {
      return errorResponse(`Error fetching templates: ${error.message}`);
    }
    
    if (!templates || templates.length === 0) {
      return successResponse({ total: 0, success: 0, failed: 0, skipped: 0 });
    }
    
    // Track statistics
    const stats = {
      total: templates.length,
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // For each template, try to update the preview image
    for (const template of templates) {
      try {
        if (!template.creatomate_template_id) {
          stats.skipped++;
          continue;
        }
        
        // Get template details from Creatomate API
        const creatomateTemplate = await getTemplate(template.creatomate_template_id);
        
        if (!creatomateTemplate) {
          stats.failed++;
          continue;
        }
        
        let previewUrl = null;
        
        // Check for preview_url first, then snapshot_url
        if (creatomateTemplate.preview_url) {
          previewUrl = creatomateTemplate.preview_url;
        } else if (creatomateTemplate.snapshot_url) {
          previewUrl = creatomateTemplate.snapshot_url;
        }
        
        // If we found a preview URL, update the template
        if (previewUrl) {
          // If validating images, we could add code here to validate the URL is a valid image
          // For simplicity, we'll skip that step in this implementation
          
          const { error: updateError } = await supabaseClient
            .from('templates')
            .update({ preview_image_url: previewUrl })
            .eq('id', template.id);
            
          if (updateError) {
            console.error(`Error updating template ${template.id}:`, updateError);
            stats.failed++;
          } else {
            stats.success++;
          }
        } else {
          stats.skipped++;
        }
      } catch (err) {
        console.error(`Error processing template ${template.id}:`, err);
        stats.failed++;
      }
    }
    
    return successResponse(stats);
  } catch (error) {
    console.error('Error updating template previews:', error);
    return errorResponse(`Error updating template previews: ${error.message}`, 500);
  }
}
