
import { useState, useRef, useEffect } from 'react';

interface UseTemplatePreviewResult {
  updatePreview: (variables: Record<string, any>) => void;
  isUpdating: boolean;
}

/**
 * Hook to manage template preview updates
 * This communicates with the Creatomate SDK to update the preview
 */
export function useTemplatePreview(): UseTemplatePreviewResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const previewRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Function to update the preview with new variables
  const updatePreview = (variables: Record<string, any>) => {
    setIsUpdating(true);

    // Get the Creatomate preview instance from window if available
    if (typeof window !== 'undefined' && (window as any).creatomatePreviewInstance) {
      previewRef.current = (window as any).creatomatePreviewInstance;
    }

    // If we have a preview instance, update it with the new variables
    if (previewRef.current) {
      try {
        console.log('Updating preview with variables:', variables);
        previewRef.current.setModifications(variables);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set a timeout to clear the updating state
        timeoutRef.current = setTimeout(() => {
          setIsUpdating(false);
        }, 300);
      } catch (error) {
        console.error('Error updating preview:', error);
        setIsUpdating(false);
      }
    } else {
      console.warn('Creatomate preview instance not found');
      setIsUpdating(false);
    }
  };

  return { updatePreview, isUpdating };
}
