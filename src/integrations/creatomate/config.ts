
/**
 * Configuration for the Creatomate integration
 * Using environment variables from src/config/creatomate.ts
 */
import { CREATOMATE_PUBLIC_TOKEN } from '@/config/creatomate';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch Creatomate API token from Supabase secrets
 * This provides a more secure way to access the API token
 * Returns the token from .env as fallback
 */
export async function getCreatomateToken(): Promise<string> {
  try {
    // First try to get from Supabase secrets table
    const { data, error } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'CREATOMATE_API_KEY')
      .maybeSingle();
      
    if (error) {
      console.warn('Error fetching Creatomate API token from Supabase:', error.message);
    }
    
    if (data?.value) {
      console.log('Using Creatomate token from Supabase secrets');
      return data.value;
    }
    
    // Fallback to environment variable
    if (CREATOMATE_PUBLIC_TOKEN) {
      console.log('Using Creatomate token from environment variable');
      return CREATOMATE_PUBLIC_TOKEN;
    }
    
    throw new Error('Creatomate API token is missing. Set in Supabase secrets or .env file');
  } catch (error) {
    console.error('Failed to get Creatomate token:', error);
    throw error;
  }
}

/**
 * Fetch Creatomate template ID from Supabase secrets
 * This provides a more secure way to access the template ID
 * Returns the template ID from .env as fallback
 */
export async function getCreatomateTemplateId(): Promise<string> {
  try {
    // First try to get from Supabase secrets table
    const { data, error } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'CREATOMATE_TEMPLATE_ID')
      .maybeSingle();
      
    if (error) {
      console.warn('Error fetching Creatomate template ID from Supabase:', error.message);
    }
    
    if (data?.value) {
      console.log('Using template ID from Supabase secrets');
      return data.value;
    }
    
    throw new Error('Creatomate template ID is missing. Set in Supabase secrets.');
  } catch (error) {
    console.error('Failed to get Creatomate template ID:', error);
    throw error;
  }
}

/**
 * Helper function to ensure template variables are formatted correctly for Creatomate
 * @param variables The template variables to format
 * @returns Formatted variables ready for the Creatomate preview
 */
export function formatVariablesForPlayer(variables: Record<string, any> = {}): Record<string, any> {
  // Make a copy to avoid mutating the original
  const formattedVariables = { ...variables };
  
  // Check if variables is empty or undefined
  if (!variables || Object.keys(variables).length === 0) {
    console.log('No variables to format');
    return {};
  }
  
  console.log('Formatting variables for preview:', variables);
  
  // Simple validation to ensure we have proper format
  Object.entries(formattedVariables).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      console.warn(`Variable ${key} has null or undefined value, removing it`);
      delete formattedVariables[key];
    }
  });
  
  return formattedVariables;
}

/**
 * Simple check if the SDK is loaded and available
 */
export function isCreatomateSDKAvailable(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if the Preview constructor exists
  return typeof window.Creatomate?.Preview === 'function';
}

/**
 * Manually load the Creatomate SDK if it's not already loaded.
 * This is useful if the script tag in index.html fails to load for any reason.
 * @returns Promise that resolves when SDK is loaded or rejects on timeout
 */
export function loadCreatomateSDKManually(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If SDK already available, resolve immediately
    if (isCreatomateSDKAvailable()) {
      console.log('Creatomate SDK already loaded');
      resolve();
      return;
    }
    
    console.log('Attempting to manually load Creatomate SDK...');
    
    // Check if script already exists
    const existingScript = document.getElementById('creatomate-sdk');
    if (existingScript) {
      console.log('Found existing script tag, waiting for it to load');
      // If script exists but SDK not loaded yet, wait for it
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for existing Creatomate SDK to load'));
      }, 10000);
      
      const checkInterval = setInterval(() => {
        if (isCreatomateSDKAvailable()) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          console.log('Existing Creatomate SDK loaded successfully');
          resolve();
        }
      }, 200);
      return;
    }
    
    // Create new script element if none exists
    const script = document.createElement('script');
    script.id = 'creatomate-sdk';
    script.src = 'https://cdn.creatomate.com/js/preview.js';
    script.async = true;
    
    // Set up event handlers
    script.onload = () => {
      console.log('Creatomate SDK loaded successfully via dynamic script');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load Creatomate SDK');
      reject(new Error('Failed to load Creatomate SDK script'));
    };
    
    // Add to document
    document.head.appendChild(script);
  });
}

// Add TypeScript interface for Window with Creatomate property
declare global {
  interface Window {
    Creatomate?: {
      Preview?: any;
      Player?: any;
      [key: string]: any;
    };
  }
}
