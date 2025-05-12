
/**
 * Configuration for the Creatomate integration
 * Using environment variables from src/config/creatomate.ts
 */
import { CREATOMATE_PUBLIC_TOKEN } from '@/config/creatomate';

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
