
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

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

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();
    
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
    
    if (action === 'import-template') {
      // Import template action
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      
      const { templateId } = await req.json();
      if (!templateId) {
        return new Response(JSON.stringify({ error: 'Template ID is required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      // Fetch template from Creatomate API
      const response = await fetch(`https://api.creatomate.com/v1/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Creatomate API error: ${response.statusText}` }),
          { status: response.status, headers: corsHeaders }
        );
      }
      
      const templateData = await response.json();
      
      // Extract platforms (resolutions) from the template
      const platforms = templateData.outputs.map((output: any) => ({
        id: output.id || crypto.randomUUID(),
        name: output.name || `${output.width}x${output.height}`,
        width: output.width,
        height: output.height,
        aspect_ratio: `${output.width}:${output.height}`
      }));
      
      // Extract variables from the template
      const variables: Record<string, any> = {};
      if (templateData.elements) {
        templateData.elements.forEach((element: any) => {
          if (element.name) {
            if (element.properties && element.properties.text) {
              variables[element.name] = {
                type: 'text',
                default: element.properties.text,
                value: element.properties.text
              };
            } else if (element.properties && element.properties.source) {
              variables[element.name] = {
                type: 'media',
                default: element.properties.source,
                value: element.properties.source
              };
            } else if (element.properties && element.properties.fill_color) {
              variables[element.name] = {
                type: 'color',
                default: element.properties.fill_color,
                value: element.properties.fill_color
              };
            }
          }
        });
      }
      
      // Create a new template in the database
      const template = {
        name: templateData.name,
        description: templateData.description || `Template for various sizes`,
        preview_image_url: templateData.preview_url || '',
        creatomate_template_id: templateData.id,
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
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      return new Response(JSON.stringify(data), { headers: corsHeaders });
      
    } else if (action === 'start-render') {
      // Start render action
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      
      const { templateId, variables, platforms } = await req.json();
      if (!templateId || !platforms || !Array.isArray(platforms)) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
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
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ renders })
      });
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Creatomate API error: ${response.statusText}` }),
          { status: response.status, headers: corsHeaders }
        );
      }
      
      const data = await response.json();
      const renderIds = data.renders.map((render: any) => render.id);
      
      return new Response(JSON.stringify({ renderIds }), { headers: corsHeaders });
      
    } else if (action === 'check-render') {
      // Check render status action
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      
      const { renderIds } = await req.json();
      if (!renderIds || !Array.isArray(renderIds)) {
        return new Response(JSON.stringify({ error: 'Render IDs are required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      // Check status for each render ID
      const statusPromises = renderIds.map(async (renderId: string) => {
        const response = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to check render status: ${response.statusText}`);
          return {
            id: renderId,
            status: 'error',
            progress: 0,
            url: null
          };
        }
        
        const data = await response.json();
        return {
          id: renderId,
          status: data.status,
          progress: data.progress || 0,
          url: data.url || null
        };
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
