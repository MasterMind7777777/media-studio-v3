
import { Template } from '@/types';
import { isImageUrl, isAudioUrl, isVideoUrl } from '@/lib/utils';

/**
 * Gets the best preview image URL for a template
 * Prioritizes: 
 * 1. First image media variable (source) in the template
 * 2. Template's preview_image_url if it's actually an image
 * 3. Default placeholder
 * 
 * @param template The template to get preview image for
 * @returns The best available preview image URL
 */
export function getTemplatePreviewImage(template: { id: string, variables?: Record<string, any>, preview_image_url?: string } | null): string {
  if (!template) return '/placeholder.svg';
  
  // First try to extract the first media variable URL that is an image
  if (template.variables) {
    const variableEntries = Object.entries(template.variables);
    let bestImageUrl = '';
    
    // First pass - look for source variables that are images
    for (const [key, value] of variableEntries) {
      if (key.includes('.source') && typeof value === 'string' && value.startsWith('http')) {
        // Skip audio files which were incorrectly being used as previews
        if (isAudioUrl(value)) {
          console.log(`Skipping audio file for preview: ${value}`);
          continue;
        }
        
        // Prioritize verified image URLs
        if (isImageUrl(value)) {
          console.log(`Found good image variable for preview: ${value}`);
          return value;
        }
        
        // Keep track of the first media URL even if we're not sure it's an image
        // We'll use this as a fallback if we don't find a confirmed image
        if (!bestImageUrl) {
          bestImageUrl = value;
        }
      }
    }
    
    // If we found any media URL and couldn't confirm a better one, use it
    if (bestImageUrl && !isAudioUrl(bestImageUrl)) {
      console.log(`Using best available media variable for preview: ${bestImageUrl}`);
      return bestImageUrl;
    }
  }
  
  // Fall back to the template's preview_image_url if it exists and is not an audio file
  if (template.preview_image_url) {
    if (!isAudioUrl(template.preview_image_url)) {
      return template.preview_image_url;
    } else {
      console.log(`Template ${template.id} has an audio file as preview_image_url, skipping`);
    }
  }
  
  // Last resort: use placeholder
  return '/placeholder.svg';
}

/**
 * Returns the preview URL for a template
 * @param template The template object
 * @returns The preview image URL
 */
export function useTemplatePreview(template: Template | null): string {
  return getTemplatePreviewImage(template);
}
