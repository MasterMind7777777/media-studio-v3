
import {
  isCreatomatePreviewDisabled,
  getCreatomateToken
} from '@/lib/loadCreatomatePreview';

// Re-export for convenient imports
export {
  getCreatomateToken,
  isCreatomatePreviewDisabled as isCreatomateSDKAvailable,
  isCreatomatePreviewDisabled as isCreatomateDisabled,
};

/**
 * Gets the Creatomate template ID from environment variables
 */
export function getCreatomateTemplateId(): string {
  const templateId = import.meta.env.VITE_CREATOMATE_TEMPLATE_ID;
  if (!templateId) {
    console.error('Missing Creatomate template ID in environment variables');
    return '';
  }
  return templateId;
}
