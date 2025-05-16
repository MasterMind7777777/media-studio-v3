
/**
 * Shared utilities for interacting with the Creatomate API
 */

// Get the API key from the environment variables
export const getApiKey = () => {
  const apiKey = Deno.env.get('CREATOMATE_API_KEY');
  if (!apiKey) {
    throw new Error('CREATOMATE_API_KEY environment variable is not set');
  }
  return apiKey;
};

// Standard CORS headers for browser requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error response with proper CORS headers
export const errorResponse = (message: string, status = 400) => {
  console.error(`Error: ${message}`);
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
};

// Success response with proper CORS headers
export const successResponse = (data: unknown) => {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
};

// Platform normalization helper
export const normalizePlatform = (platform: any) => {
  if (!platform) return null;
  
  return {
    id: platform.id || '',
    name: platform.name || '',
    width: Number(platform.width) || 0,  // Ensure width is a number
    height: Number(platform.height) || 0,  // Ensure height is a number
    aspect_ratio: platform.aspect_ratio || `${platform.width}:${platform.height}`
  };
};

// Clean variables helper (similar to the one in lib/variables.ts)
export const cleanupVariables = (variables: Record<string, any>): Record<string, any> => {
  if (!variables || Object.keys(variables).length === 0) {
    return {};
  }
  
  try {
    const cleanVars: Record<string, any> = {};
    
    // Skip null/undefined values
    Object.entries(variables).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      
      // Normalize keys (remove duplicate suffixes)
      const parts = key.split('.');
      if (parts.length <= 1) {
        cleanVars[key] = value;
        return;
      }
      
      const elementName = parts[0];
      const propertyType = parts[1];
      
      // Match property type
      if (propertyType === 'text' || propertyType === 'source' || propertyType === 'fill') {
        cleanVars[`${elementName}.${propertyType}`] = value;
      } else {
        cleanVars[key] = value;
      }
    });
    
    return cleanVars;
  } catch (error) {
    console.error('Error cleaning up variables:', error);
    // In case of error, return a cleaned version of the original object
    return Object.fromEntries(
      Object.entries(variables)
        .filter(([_, v]) => v !== null && v !== undefined)
    );
  }
};

// Function to call Creatomate API
export async function callCreatomateAPI(endpoint: string, method: string, body?: any) {
  const apiKey = getApiKey();
  const baseUrl = 'https://api.creatomate.com/v1';
  const url = `${baseUrl}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Creatomate API error:`, data);
      throw new Error(data.error?.message || 'Unknown error from Creatomate API');
    }
    
    return data;
  } catch (error) {
    console.error(`Error calling Creatomate API ${endpoint}:`, error);
    throw error;
  }
}

// Get a template by ID
export async function getTemplate(templateId: string) {
  return await callCreatomateAPI(`templates/${templateId}`, 'GET');
}

// Start a render job
export async function startRender(params: any) {
  return await callCreatomateAPI('renders', 'POST', params);
}

// Get render status
export async function getRender(renderId: string) {
  return await callCreatomateAPI(`renders/${renderId}`, 'GET');
}
