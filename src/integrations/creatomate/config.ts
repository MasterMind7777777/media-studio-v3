
import { loadCreatomateSdk, isCreatomateSDKAvailable } from '@/hooks/templates/useCreatomateSDKLoader';
import { isCreatomateDisabled } from '@/components/CreatomateLoader';

// Re-export for convenient imports
export {
  loadCreatomateSdk,
  isCreatomateSDKAvailable,
  isCreatomateDisabled
};

/**
 * Gets the Creatomate public token from environment variables
 */
export function getCreatomateToken(): string {
  const token = import.meta.env.VITE_CREATOMATE_TOKEN;
  if (!token) {
    console.error('Missing Creatomate token in environment variables');
    return '';
  }
  return token;
}

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
