
import { useState, useEffect } from 'react';
import { isCreatomatePreviewDisabled } from '@/lib/loadCreatomatePreview';

// Legacy wrapper for backwards compatibility
export function useCreatomateSDKLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(true);  // Default to true since we use ESM now
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if preview is disabled
    if (isCreatomatePreviewDisabled) {
      setError(new Error('Creatomate preview is disabled via environment variable'));
      setIsLoaded(false);
      return;
    }

    // Signal that SDK is available through ESM imports
    setIsLoaded(true);
    setIsLoading(false);

    return () => {
      // No cleanup needed as we're using ESM imports now
    };
  }, []);

  return { isLoading, isLoaded, error };
}

// This function now becomes a no-op as ESM imports handle loading
export const loadCreatomateSdk = async () => {
  return Promise.resolve();  
};

// Always returns true as we're using ESM imports
export const isCreatomateSDKAvailable = (): boolean => {
  return !isCreatomatePreviewDisabled;
};

// Re-export the flag for convenience
export const isCreatomateDisabled = isCreatomatePreviewDisabled;
