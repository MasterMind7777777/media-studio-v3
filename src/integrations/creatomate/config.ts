
/**
 * Configuration for the Creatomate integration
 * Note: This is the public API key which is safe to use in the frontend
 * The private key should only be used in serverless functions
 */
export const CREATOMATE_PUBLIC_API_KEY = "73ad3003-d7fb-4a07-a2d2-6091c7543945";

/**
 * Helper function to ensure template variables are formatted correctly for Creatomate
 * @param variables The template variables to format
 * @returns Formatted variables ready for the Creatomate player
 */
export function formatVariablesForPlayer(variables: Record<string, any> = {}): Record<string, any> {
  // Make a copy to avoid mutating the original
  const formattedVariables = { ...variables };
  
  // Check if variables is empty or undefined
  if (!variables || Object.keys(variables).length === 0) {
    console.log('No variables to format');
    return {};
  }
  
  console.log('Formatting variables for player:', variables);
  return formattedVariables;
}

/**
 * Get Creatomate SDK URL
 */
export const CREATOMATE_SDK_URL = 'https://cdn.jsdelivr.net/npm/creatomate@1.2.1/dist/index.min.js';

/**
 * Maximum retry attempts for player initialization
 */
export const MAX_INITIALIZATION_RETRIES = 3;

/**
 * Delay in ms before initializing player after SDK load
 */
export const SDK_INITIALIZATION_DELAY = 300;
