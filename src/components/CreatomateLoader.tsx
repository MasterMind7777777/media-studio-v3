
import { useEffect, useState } from 'react';
import { loadCreatomateSDKManually } from '@/integrations/creatomate/config';

/**
 * A component that ensures the Creatomate SDK is loaded globally
 * This can be added near the top of the app to preload the SDK
 */
export function CreatomateLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only try to load if we haven't loaded already
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    loadCreatomateSDKManually()
      .then(() => {
        console.log('Creatomate SDK preloaded successfully');
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to preload Creatomate SDK:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      });
  }, [isLoaded, isLoading]);

  // This component doesn't render anything visible
  return null;
}
