/**
 * Configuration for the Creatomate integration
 * Using environment variables from src/config/creatomate.ts
 */
import { CREATOMATE_PUBLIC_TOKEN } from '@/config/creatomate';
import { supabase } from '@/integrations/supabase/client';

/**
 * Get Creatomate API token
 * Returns the public token from config
 */
export async function getCreatomateToken(): Promise<string> {
  // Use the public token directly since it's safe to expose
  if (CREATOMATE_PUBLIC_TOKEN) {
    console.log('Using Creatomate public token from config');
    return CREATOMATE_PUBLIC_TOKEN;
  }
  
  throw new Error('Creatomate API token is missing. Set in config/creatomate.ts');
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
