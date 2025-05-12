
import { useEffect, useState, useRef } from 'react';
import { isCreatomateSDKAvailable } from '@/integrations/creatomate/config';
import { toast } from 'sonner';

/**
 * Component to ensure the Creatomate SDK is properly loaded
 * This can be added near the top of the app to handle SDK loading
 */
export function CreatomateLoader() {
  const [sdkChecked, setSDKChecked] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;
  const toastShownRef = useRef(false);
  
  useEffect(() => {
    if (sdkChecked) return; // Don't continue checking once we're done
    
    // Check if SDK is available without trying to load it manually
    const checkSDK = () => {
      if (isCreatomateSDKAvailable()) {
        console.log('Creatomate SDK detected');
        setSDKChecked(true);
        return true;
      }
      
      // Only log a warning if we haven't exceeded max attempts
      if (loadAttempts < MAX_ATTEMPTS) {
        console.warn(`Creatomate SDK not detected (attempt ${loadAttempts + 1}/${MAX_ATTEMPTS})`);
      }
      return false;
    };
    
    // First check immediately
    if (checkSDK()) return;
    
    // If not found, check again after a delay
    const timer = setTimeout(() => {
      if (checkSDK()) return;
      
      // If still not loaded, increase attempt counter
      setLoadAttempts(prev => {
        const newCount = prev + 1;
        
        // Show a toast ONLY ONCE if we've reached the max attempts
        if (newCount >= MAX_ATTEMPTS && !toastShownRef.current) {
          toast.error('Video editor components may not work properly', {
            description: 'Please refresh the page or check your internet connection.',
            id: 'sdk-load-error', // Use an ID to prevent duplicate toasts
            duration: 5000,
          });
          toastShownRef.current = true;
          setSDKChecked(true); // Stop checking after max attempts
        }
        
        return newCount;
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [loadAttempts, sdkChecked]);

  // This component doesn't render anything visible
  return null;
}
