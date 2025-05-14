
export * from "./useTemplateVariables";
export * from "./useCreatomatePreview";
export * from "./useTemplatePreview";
export * from "./useTemplatePreviewUpdater";

// Helper function to get the first image URL from template variables
export function getTemplatePreviewImage(template: any) {
  if (!template?.variables) return '/placeholder.svg';
  
  try {
    // Find the first image URL in the variables
    const imageUrl = Object.entries(template.variables)
      .find(([key, value]) => 
        key.includes('.source') && 
        typeof value === 'string' && 
        value.startsWith('http') && 
        !value.endsWith('.mp3') && 
        !value.endsWith('.wav') && 
        !value.endsWith('.m4a')
      )?.[1];
    
    return imageUrl || '/placeholder.svg';
  } catch (e) {
    console.error('Error extracting preview image:', e);
    return '/placeholder.svg';
  }
}
