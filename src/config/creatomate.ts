
/**
 * Creatomate configuration
 * Environment variables for Creatomate integration
 */

export const CREATOMATE_PUBLIC_TOKEN = 
  import.meta.env.VITE_CREATOMATE_TOKEN ?? '';
  
export const DEFAULT_TEMPLATE_ID =
  import.meta.env.VITE_CREATOMATE_TEMPLATE_ID ?? '';

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
