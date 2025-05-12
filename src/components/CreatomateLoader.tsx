
import { useEffect, useState } from 'react';
import { isCreatomateSDKAvailable } from '@/integrations/creatomate/config';
import { toast } from 'sonner';

/**
 * Component to ensure the Creatomate SDK is properly loaded
 * This can be added near the top of the app to handle SDK loading
 */
export function CreatomateLoader() {
  const [sdkChecked, setSDKChecked] = useState(false);
  
  useEffect(() => {
    // Only check if SDK is available without trying to load it manually
    // The SDK should already be loaded via the script tag in index.html
    const checkSDK = () => {
      if (isCreatomateSDKAvailable()) {
        console.log('Creatomate SDK detected');
        setSDKChecked(true);
        return;
      }
      
      console.warn('Creatomate SDK not detected after initial page load');
      toast.error('Video editor components may not work properly', {
        description: 'Please refresh the page or check your internet connection.'
      });
      setSDKChecked(true);
    };
    
    // Wait a short time for the script to load
    const timer = setTimeout(checkSDK, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything visible
  return null;
}
