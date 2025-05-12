
import { useEffect, useState } from 'react';
import { isCreatomateSDKAvailable, loadCreatomateSDKManually } from '@/integrations/creatomate/config';
import { toast } from 'sonner';

/**
 * Component to ensure the Creatomate SDK is properly loaded
 * This can be added near the top of the app to handle SDK loading
 */
export function CreatomateSDKLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  useEffect(() => {
    // Check if SDK is already loaded
    if (isCreatomateSDKAvailable()) {
      console.log('Creatomate SDK already loaded on mount');
      setIsLoaded(true);
      return;
    }
    
    // Only try to load if we haven't tried too many times
    if (retryCount >= maxRetries) {
      console.error(`Failed to load Creatomate SDK after ${maxRetries} retries`);
      toast.error('Failed to load video editor', {
        description: 'Please refresh the page or try again later.'
      });
      return;
    }
    
    // Try to load the SDK
    setIsLoading(true);
    console.log(`Attempting to load Creatomate SDK (attempt ${retryCount + 1})`);
    
    loadCreatomateSDKManually()
      .then(() => {
        console.log('Creatomate SDK loaded successfully');
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Creatomate SDK:', err);
        setIsLoading(false);
        // Retry after a delay
        setTimeout(() => {
          setRetryCount(count => count + 1);
        }, 2000);
      });
  }, [retryCount]);

  // This component doesn't render anything visible
  return null;
}
