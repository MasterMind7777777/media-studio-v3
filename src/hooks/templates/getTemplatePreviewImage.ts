
import { Template } from "@/types";
import { isImageUrl } from "@/lib/utils";

/**
 * Extracts the best preview image URL from a template
 * Prioritizes:
 * 1. Explicit preview_image_url if it exists
 * 2. Any image URL found in the template variables
 * 3. Fallback to placeholder
 */
export function getTemplatePreviewImage(template: Template): string {
  // If template has a dedicated preview image, use it
  if (template.preview_image_url && template.preview_image_url !== '/placeholder.svg') {
    return template.preview_image_url;
  }

  // Look through variables for image URLs
  if (template.variables) {
    // Find first variable that contains an image URL
    const variableValues = Object.values(template.variables);
    
    for (const value of variableValues) {
      if (typeof value === 'string' && isImageUrl(value)) {
        return value;
      }
    }

    // Check for nested values (e.g. in element.source)
    for (const key in template.variables) {
      const variable = template.variables[key];
      if (typeof variable === 'object' && variable !== null) {
        for (const nestedKey in variable) {
          const nestedValue = variable[nestedKey];
          if (typeof nestedValue === 'string' && isImageUrl(nestedValue)) {
            return nestedValue;
          }
        }
      }
    }
  }

  // Fallback to placeholder
  return '/placeholder.svg';
}
