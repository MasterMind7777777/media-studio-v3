
/**
 * Configuration for the Creatomate integration
 * Note: This is the public API key which is safe to use in the frontend
 * The private key should only be used in serverless functions
 */
export const CREATOMATE_PUBLIC_API_KEY = "73ad3003-d7fb-4a07-a2d2-6091c7543945";

/**
 * Helper function to ensure template variables are formatted correctly for Creatomate
 */
export function formatVariablesForPlayer(variables: Record<string, any> = {}): Record<string, any> {
  return variables;
}
