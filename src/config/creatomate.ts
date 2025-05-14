
/**
 * Creatomate configuration
 * Environment variables for Creatomate integration
 */
import { getCreatomateToken, isCreatomatePreviewDisabled } from '@/lib/loadCreatomatePreview';

// Public token that can be safely exposed in frontend
export const CREATOMATE_PUBLIC_TOKEN = getCreatomateToken();
  
// Default template ID as fallback
export const DEFAULT_TEMPLATE_ID =
  import.meta.env.VITE_CREATOMATE_TEMPLATE_ID || '';

// Re-export the disabled flag for convenience
export const isCreatomateDisabled = isCreatomatePreviewDisabled;

/**
 * Basic video composition JSON to use as fallback
 * when no template ID is provided
 */
export const BASIC_COMPOSITION = {
  output_format: 'mp4',
  width: 1280, 
  height: 720,
  elements: [
    { 
      id: 'background',
      type: 'rectangle',
      width: '100%',
      height: '100%',
      fill: '#1a1a1a'
    },
    { 
      id: 'title', 
      type: 'text', 
      text: 'Drag me to edit', 
      font_size: 60, 
      fill: '#ffffff',
      x: '50%', 
      y: '50%' 
    }
  ]
};
