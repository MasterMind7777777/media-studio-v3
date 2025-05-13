
import { Template } from '@/types';

/**
 * Gets the best preview image URL for a template
 * Prioritizes: 
 * 1. First media variable (source) in the template
 * 2. Template's preview_image_url
 * 3. Default placeholder
 * 
 * @param template The template to get preview image for
 * @returns The best available preview image URL
 */
export function getTemplatePreviewImage(template: Template | null): string {
  if (!template) return '/placeholder.svg';
  
  // First try to extract the first media variable URL
  if (template.variables) {
    const variableKeys = Object.keys(template.variables);
    
    // Look specifically for source/media variables
    for (const key of variableKeys) {
      if (key.includes('.source')) {
        const sourceValue = template.variables[key];
        if (typeof sourceValue === 'string' && sourceValue.startsWith('http')) {
          console.log(`Using media variable for preview: ${sourceValue}`);
          return sourceValue;
        }
      }
    }
  }
  
  // Fall back to the template's preview_image_url
  if (template.preview_image_url) {
    return template.preview_image_url;
  }
  
  // Last resort: use placeholder
  return '/placeholder.svg';
}
