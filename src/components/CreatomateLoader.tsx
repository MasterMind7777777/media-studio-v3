
import React, { useEffect } from 'react';
import { useCreatomateSDKLoader } from '@/hooks/templates/useCreatomateSDKLoader';
import { useToast } from '@/hooks/use-toast';

// Track shown toast IDs to prevent duplicates
const shownToastIds = new Set<string>();

export function CreatomateLoader() {
  const { isLoading, isLoaded, error } = useCreatomateSDKLoader();
  const { toast } = useToast();

  // Show toast notifications for loader status
  useEffect(() => {
    if (error) {
      const errorToastId = 'creatomate-sdk-error';
      if (!shownToastIds.has(errorToastId)) {
        shownToastIds.add(errorToastId);
        toast({
          id: errorToastId,
          title: "Failed to load Creatomate SDK",
          description: "Video preview functionality may be limited.",
          variant: "destructive"
        });
      }
    } else if (isLoaded) {
      const successToastId = 'creatomate-sdk-loaded';
      if (!shownToastIds.has(successToastId)) {
        shownToastIds.add(successToastId);
        toast({
          id: successToastId,
          title: "Creatomate SDK loaded",
          description: "Video preview functionality is ready."
        });
      }
    }
  }, [isLoaded, error, toast]);

  return null; // This is a utility component with no UI
}

// Flag for testing/debugging
export const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';
