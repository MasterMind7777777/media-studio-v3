
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { CreatomateApi, RenderParams } from '../_shared/creatomate-api.ts';

// Define necessary types directly in the edge function
interface Platform {
  id: string;
  name: string;
  width: number;
  height: number;
  aspect_ratio: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview_image_url: string;
  creatomate_template_id: string;
  variables: Record<string, any>;
  platforms: Platform[];
  category: string;
  is_active: boolean;
  created_at: string;
}

// Define Cors headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
};

// Helper function to get the API key from secrets table
async function getCreatomateApiKey(supabaseClient: any) {
  try {
    const { data, error } = await supabaseClient
      .from('secrets')
      .select('value')
      .eq('name', 'CREATOMATE_API_KEY')
      .maybeSingle();
      
    if (error || !data) {
      console.error('Error fetching API key:', error);
      return null;
    }
    
    return data.value;
  } catch (e) {
    console.error('Failed to get API key:', e);
    return null;
  }
}

// Enhanced function to extract variables from CURL example in text
function extractVariablesFromCurl(text: string): Record<string, any> | null {
  try {
    // More robust regex pattern to match "modifications" JSON object in curl commands
    // This pattern looks for the modifications object with various formatting possibilities
    const curlMatch = text.match(/modifications"?\s*:?\s*(\{[^}]+\})/);
    if (!curlMatch || !curlMatch[1]) {
      console.log('No modifications found in curl example');
      return null;
    }

    // Clean up the JSON string to make it parsable
    let jsonStr = curlMatch[1].replace(/'/g, '"');
    
    // Handle trailing commas which are invalid in JSON
    jsonStr = jsonStr.replace(/,\s*}/g, '}');
    
    // Replace multiple whitespace with single space
    jsonStr = jsonStr.replace(/\s+/g, ' ');
    
    console.log('Extracted modifications string from curl:', jsonStr);
    
    try {
      // First try to parse directly
      return JSON.parse(jsonStr);
    } catch (e) {
      console.log('Failed to parse JSON directly, trying with additional cleanup:', e);
      
      // Additional cleanup for malformed JSON
      // Replace unquoted keys with quoted keys
      jsonStr = jsonStr.replace(/(\{|\,)\s*([a-zA-Z0-9_\.\-]+)\s*:/g, '$1"$2":');
      
      // Ensure all string values are properly quoted
      jsonStr = jsonStr.replace(/:\s*([^",\{\}\[\]\s][^,\}\]]*)/g, ':"$1"');
      
      console.log('After additional cleanup:', jsonStr);
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.error('Failed to extract variables from curl example:', e);
    return null;
  }
}

// Helper function to get test render info for a template to extract variable modifications
async function getTemplateRenderInfo(templateId: string, creatomateApi: CreatomateApi) {
  try {
    console.log(`Fetching render examples for template ${templateId}`);
    
    // Use our API wrapper instead of direct fetch
    const renders = await creatomateApi.getRenders({ 
      template_id: templateId,
      limit: 1
    });
    
    if (renders && renders.length > 0 && renders[0].metadata) {
      try {
        // Try to parse metadata as JSON containing modifications
        const metadata = JSON.parse(renders[0].metadata);
        if (metadata.modifications) {
          console.log('Found render example with modifications:', metadata.modifications);
          return metadata.modifications;
        }
      } catch (e) {
        console.log('Metadata is not valid JSON or does not contain modifications');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching template render info:', error);
    return null;
  }
}

// Improved function to extract variables from template elements
function extractVariablesFromElements(elements: any[]): Record<string, any> {
  const variables: Record<string, any> = {};
  
  if (!elements || !Array.isArray(elements)) {
    console.log('No elements array found or elements is not an array');
    return variables;
  }
  
  console.log(`Processing ${elements.length} elements to extract variables`);
  
  elements.forEach((element, index) => {
    if (!element) return;
    
    // Extract element name, defaulting to element type + index if name not available
    const elementName = element.name || `${element.type || 'Element'}${index}`;
    console.log(`Processing element: ${elementName} (type: ${element.type || 'unknown'})`);
    
    // Check for text property in different locations
    if (element.text !== undefined) {
      variables[`${elementName}.text`] = element.text;
      console.log(`Added text variable: ${elementName}.text = ${element.text}`);
    } 
    else if (element.properties && element.properties.text !== undefined) {
      variables[`${elementName}.text`] = element.properties.text;
      console.log(`Added text variable from properties: ${elementName}.text = ${element.properties.text}`);
    }
    
    // Check for source property in different locations
    if (element.source !== undefined) {
      variables[`${elementName}.source`] = element.source;
      console.log(`Added source variable: ${elementName}.source = ${element.source}`);
    } 
    else if (element.properties && element.properties.source !== undefined) {
      variables[`${elementName}.source`] = element.properties.source;
      console.log(`Added source variable from properties: ${elementName}.source = ${element.properties.source}`);
    }
    
    // Check for fill_color property
    if (element.fill_color !== undefined) {
      variables[`${elementName}.fill`] = element.fill_color;
      console.log(`Added fill variable: ${elementName}.fill = ${element.fill_color}`);
    } 
    else if (element.properties && element.properties.fill_color !== undefined) {
      variables[`${elementName}.fill`] = element.properties.fill_color;
      console.log(`Added fill variable from properties: ${elementName}.fill = ${element.properties.fill_color}`);
    }
    
    // Check for other dynamic properties marked with "dynamic": true
    if (element.dynamic === true) {
      // If the element is marked as dynamic but we didn't capture any specific property,
      // add a placeholder based on the element type
      if (element.type === 'text' && !variables[`${elementName}.text`]) {
        variables[`${elementName}.text`] = `Text for ${elementName}`;
        console.log(`Added placeholder text variable: ${elementName}.text = Text for ${elementName}`);
      } 
      else if ((element.type === 'image' || element.type === 'video' || element.type === 'audio') && !variables[`${elementName}.source`]) {
        variables[`${elementName}.source`] = element.source || '';
        console.log(`Added placeholder source variable: ${elementName}.source = ${element.source || ''}`);
      }
    }
    
    // Process nested elements if any
    if (element.elements && Array.isArray(element.elements)) {
      const nestedVariables = extractVariablesFromElements(element.elements);
      Object.assign(variables, nestedVariables);
    }
  });
  
  return variables;
}

// Define status mapping from Creatomate to our database status values
const mapCreatomateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'planned': 'pending',
    'waiting': 'pending',
    'queued': 'pending',
    'transcribing': 'processing',
    'rendering': 'processing',
    'succeeded': 'completed',
    'failed': 'failed'
  };
  
  return statusMap[status] || 'pending'; // Default to 'pending' for unknown statuses
};

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Extract the action from the request body instead of the URL path
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const action = requestBody.action;
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter in request body' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log('Action requested:', action);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the Creatomate API key from secrets table
    const apiKey = await getCreatomateApiKey(supabase);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured in secrets table' }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Initialize the Creatomate API client
    const creatomateApi = new CreatomateApi(apiKey);
    
    // Get the site URL for webhook
    const siteUrl = Deno.env.get('SITE_URL');
    if (!siteUrl) {
      return new Response(
        JSON.stringify({ error: 'SITE_URL environment variable not set' }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const webhookUrl = `${siteUrl}/functions/v1/creatomate-webhook`;
    
    if (action === 'import-template') {
      // Import template action
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      
      const { templateId, curlCommand } = requestBody;
      if (!templateId) {
        return new Response(JSON.stringify({ error: 'Template ID is required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      console.log('Importing template:', templateId);
      
      // If curl command was provided, parse it to extract variables
      let curlModifications = null;
      if (curlCommand) {
        console.log('Processing provided CURL command');
        curlModifications = extractVariablesFromCurl(curlCommand);
        if (curlModifications) {
          console.log('Successfully parsed modifications from CURL command:', curlModifications);
        }
      }
      
      // Fetch template from Creatomate API using our wrapper
      try {
        const templateData = await creatomateApi.getTemplate(templateId);
        console.log('Template data structure:', JSON.stringify(templateData, null, 2));
        
        // Extract platforms (resolutions) from the template
        let platforms: Platform[] = [];
        
        // Check if templateData.outputs exists before mapping
        if (templateData.outputs && Array.isArray(templateData.outputs)) {
          platforms = templateData.outputs.map((output: any) => ({
            id: output.id || crypto.randomUUID(),
            name: output.name || `${output.width}x${output.height}`,
            width: output.width,
            height: output.height,
            aspect_ratio: `${output.width}:${output.height}`
          }));
        } else {
          // Create a default platform if no outputs are provided
          // Check if we can get dimensions from the template itself
          let width = 1920;
          let height = 1080;
          
          if (templateData.source && templateData.source.width && templateData.source.height) {
            width = templateData.source.width;
            height = templateData.source.height;
          } else if (templateData.width && templateData.height) {
            width = templateData.width;
            height = templateData.height;
          }
          
          platforms = [{
            id: crypto.randomUUID(),
            name: `${width}x${height}`,
            width,
            height,
            aspect_ratio: `${width}:${height}`
          }];
          
          console.log('Created default platform:', platforms[0]);
        }
        
        // Initialize variables object
        const variables: Record<string, any> = {};
        
        // 1. First use the variables provided in the curl command if available
        if (curlModifications) {
          Object.entries(curlModifications).forEach(([key, value]) => {
            variables[key] = value;
          });
          console.log('Added variables from curl command:', variables);
        }
        
        // 2. Extract variables from template elements
        let elementsToProcess: any[] = [];
        
        // Get elements from the right place in the structure
        if (templateData.source && templateData.source.elements) {
          elementsToProcess = templateData.source.elements;
          console.log('Using templateData.source.elements for variable extraction');
        } else if (templateData.elements) {
          elementsToProcess = templateData.elements;
          console.log('Using templateData.elements for variable extraction');
        }
        
        // Process elements to extract variables
        if (elementsToProcess.length > 0) {
          const elementVariables = extractVariablesFromElements(elementsToProcess);
          
          // Add element variables that don't already exist from curl command
          Object.entries(elementVariables).forEach(([key, value]) => {
            if (!variables[key]) {
              variables[key] = value;
            }
          });
          
          console.log('Extracted variables from elements:', elementVariables);
        } else {
          console.log('No elements found for variable extraction');
        }
        
        // 3. Additionally, try to fetch a sample render for this template to extract modification variables
        const renderModifications = await getTemplateRenderInfo(templateId, creatomateApi);
        
        if (renderModifications) {
          // Add all modifications as variables if they don't exist yet
          Object.entries(renderModifications).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
              if (!variables[key]) {
                variables[key] = value;
              }
            }
          });
          console.log('Added variables from render example:', renderModifications);
        }
        
        // 4. If we still don't have variables, try to parse from curl examples in the description
        if (Object.keys(variables).length === 0 && templateData.description) {
          const descriptionVariables = extractVariablesFromCurl(templateData.description);
          
          if (descriptionVariables) {
            Object.entries(descriptionVariables).forEach(([key, value]) => {
              if (!variables[key] && (typeof value === 'string' || typeof value === 'number')) {
                variables[key] = value;
              }
            });
            console.log('Parsed variables from template description:', descriptionVariables);
          } else {
            console.log('No variables found in template description');
          }
        }
        
        console.log('Final extracted variables:', variables);
        
        // Create a new template in the database
        const template = {
          name: templateData.name || `Template ${templateId}`,
          description: templateData.description || `Template for various sizes`,
          preview_image_url: templateData.preview_url || '',
          creatomate_template_id: templateData.id || templateId,
          variables,
          platforms,
          category: 'Imported',
          is_active: true
        };
        
        const { data, error } = await supabase
          .from('templates')
          .insert([template])
          .select()
          .single();
          
        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({ error: `Database error: ${error.message}` }),
            { status: 500, headers: corsHeaders }
          );
        }
        
        return new Response(JSON.stringify(data), { headers: corsHeaders });
        
      } catch (error) {
        console.error('Error fetching template from Creatomate:', error);
        return new Response(
          JSON.stringify({ error: `Failed to fetch template: ${error.message}` }),
          { status: 500, headers: corsHeaders }
        );
      }
      
    } else if (action === 'start-render') {
      // Start render action
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      
      // Support both parameter naming conventions for backward compatibility
      // creatomateTemplateId (preferred), template_id (backward compatibility)
      const { 
        creatomateTemplateId,
        template_id, 
        variables, 
        platforms,
        user_id,
        database_job_id
      } = requestBody;
      
      // Combine both parameters, with creatomateTemplateId taking precedence if both are provided
      const templateIdentifier = creatomateTemplateId || template_id;
      
      console.log('Template identifier provided:', templateIdentifier);
      console.log('User ID provided:', user_id);
      console.log('Database job ID provided:', database_job_id);
      
      if (!templateIdentifier) {
        console.error('Missing template ID in request. Request body:', JSON.stringify(requestBody));
        return new Response(JSON.stringify({ 
          error: 'Creatomate template ID is required',
          details: 'Neither creatomateTemplateId nor template_id was provided in the request' 
        }), {
          status: 400, 
          headers: corsHeaders 
        });
      }
      
      if (!platforms || !Array.isArray(platforms)) {
        return new Response(JSON.stringify({ error: 'Platforms must be an array' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      console.log(`Starting render with Creatomate template ID: ${templateIdentifier}`);
      
      // Prepare the modifications object for Creatomate
      const modifications = {};
      
      // If variables are provided, transform them into the format Creatomate expects
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          // Add directly to modifications as Creatomate expects this format
          modifications[key] = value;
        });
      }
      
      console.log('Sending modifications to Creatomate:', modifications);
      
      // Process each platform as a separate render using the API wrapper
      try {
        const allRenders = [];
        
        for (const platform of platforms) {
          console.log(`Processing platform ${platform.name || `${platform.width}x${platform.height}`}`);
          
          // Create a request payload for this platform
          const renderParams: RenderParams = {
            template_id: templateIdentifier,
            output_format: 'mp4',
            width: platform.width,
            height: platform.height,
            modifications,
            webhook_url: webhookUrl,
            metadata: JSON.stringify({
              platform_id: platform.id,
              user_id: user_id,
              template_id: requestBody.template_id,
              database_job_id: database_job_id
            })
          };
          
          // Use our API wrapper to create the render
          try {
            const render = await creatomateApi.createRender(renderParams);
            allRenders.push(render);
          } catch (error) {
            console.error(`Error creating render for platform ${platform.name}:`, error);
            throw error;
          }
        }
        
        console.log('All render requests completed. Total renders:', allRenders.length);
        
        // Return both the full render objects and just the IDs for backwards compatibility
        return new Response(
          JSON.stringify({ 
            renders: allRenders.map(render => ({
              ...render,
              status: mapCreatomateStatus(render.status) // Map status for database compatibility
            })),
            renderIds: allRenders.map(render => render.id)
          }), 
          { headers: corsHeaders }
        );
        
      } catch (error) {
        console.error('Error during render process:', error);
        return new Response(
          JSON.stringify({ 
            error: error.message || 'Failed to process render requests',
            details: error.details || 'An error occurred while sending requests to Creatomate'
          }),
          { status: 500, headers: corsHeaders }
        );
      }
      
    } else if (action === 'check-render') {
      // Check render status action using our API wrapper
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      
      const { renderIds } = requestBody;
      if (!renderIds || !Array.isArray(renderIds)) {
        return new Response(JSON.stringify({ error: 'Render IDs are required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      // Check status for each render ID using the API wrapper
      const statusPromises = renderIds.map(async (renderId: string) => {
        try {
          const render = await creatomateApi.getRender(renderId);
          
          return {
            id: renderId,
            status: render.status,
            progress: render.progress || 0,
            url: render.url || null
          };
        } catch (error) {
          console.error(`Failed to check render status for ${renderId}:`, error);
          
          return {
            id: renderId,
            status: 'error',
            progress: 0,
            url: null,
            error: error.message
          };
        }
      });
      
      const results = await Promise.all(statusPromises);
      
      // Create a map of render IDs to their status
      const statusMap: Record<string, any> = {};
      results.forEach((result) => {
        statusMap[result.id] = {
          status: result.status,
          progress: result.progress,
          url: result.url
        };
      });
      
      return new Response(JSON.stringify(statusMap), { headers: corsHeaders });
      
    } else if (action === 'parse-curl') {
      // New action to parse a CURL command and extract variables
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      
      const { curlCommand } = requestBody;
      if (!curlCommand) {
        return new Response(JSON.stringify({ error: 'CURL command is required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      console.log('Parsing CURL command:', curlCommand);
      
      // Extract template ID
      let templateId = null;
      
      // Pattern 1: Extract from URL - templates/{id}
      const templateUrlMatch = curlCommand.match(/templates\/([a-f0-9-]{36})/i);
      
      // Pattern 2: Extract from JSON - "template_id": "{id}"
      const templateJsonMatch = curlCommand.match(/"template_id":\s*"([a-f0-9-]{36})"/i);
      
      // Use the first match found
      if (templateUrlMatch && templateUrlMatch[1]) {
        templateId = templateUrlMatch[1];
      } else if (templateJsonMatch && templateJsonMatch[1]) {
        templateId = templateJsonMatch[1];
      }
      
      // Extract modifications from CURL
      const modifications = extractVariablesFromCurl(curlCommand);
      
      if (!templateId && !modifications) {
        return new Response(JSON.stringify({
          error: 'Could not extract template ID or modifications from CURL command'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({
        templateId,
        modifications: modifications || {}
      }), {
        headers: corsHeaders
      });
      
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
