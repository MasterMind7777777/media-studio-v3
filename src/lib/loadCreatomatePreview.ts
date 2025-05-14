
import { Preview } from '@creatomate/preview';

/**
 * Flag to check if Creatomate preview is disabled via environment variable
 */
export const isCreatomatePreviewDisabled = 
  typeof import.meta !== 'undefined' && 
  import.meta.env?.VITE_CREATOMATE_PREVIEW === 'off';

/**
 * Typed interface for Preview options
 */
export interface CreatomatePreviewOptions {
  token: string;
  templateId?: string;
  container: HTMLElement;
  mode?: 'player' | 'interactive';
  modifications?: Record<string, any>;
}

/**
 * Cached preview instance to prevent duplicate initialization
 */
let previewInstance: Preview | null = null;

/**
 * Creates and returns a Creatomate Preview instance
 * 
 * @param options Configuration options for the preview
 * @returns Promise resolving to a Preview instance
 */
export async function createPreviewInstance(options: CreatomatePreviewOptions): Promise<Preview> {
  if (isCreatomatePreviewDisabled) {
    throw new Error('Creatomate preview is disabled via environment variable');
  }
  
  try {
    // Create the preview instance using the ESM module
    const preview = new Preview({
      ...options,
    });
    
    // Return the preview instance
    return preview;
  } catch (error) {
    console.error('Error initializing Creatomate Preview:', error);
    throw error;
  }
}

/**
 * Creates or retrieves a cached preview instance
 * 
 * @param options Configuration options for the preview
 * @param forceNew Whether to force creating a new instance
 * @returns Promise resolving to a Preview instance
 */
export async function getPreviewInstance(
  options: CreatomatePreviewOptions,
  forceNew = false
): Promise<Preview> {
  // If we already have an instance and we're not forcing a new one, return it
  if (previewInstance && !forceNew) {
    return previewInstance;
  }
  
  // Create a new instance
  const newInstance = await createPreviewInstance(options);
  
  // Cache the instance
  previewInstance = newInstance;
  
  return newInstance;
}

/**
 * Disposes the current preview instance if it exists
 */
export function disposePreviewInstance(): void {
  if (previewInstance) {
    try {
      previewInstance.dispose();
    } catch (error) {
      console.warn('Error disposing Creatomate preview instance:', error);
    }
    previewInstance = null;
  }
}

/**
 * Gets the Creatomate token from environment variables
 */
export function getCreatomateToken(): string {
  const token = import.meta.env.VITE_CREATOMATE_TOKEN;
  if (!token) {
    console.error('Missing Creatomate token in environment variables');
    return '';
  }
  return token;
}
