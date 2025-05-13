
import { useEffect, useState, useRef } from 'react';
import { isCreatomateSDKAvailable, ensureCreatomateSDK } from '@/integrations/creatomate/config';
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
    // Use session storage to track if the toast has been shown in this session
    const hasShownToastThisSession = sessionStorage.getItem('creatomate-sdk-toast-shown') === 'true';
    
    if (hasShownToastThisSession) {
      toastShownRef.current = true;
    }
    
    if (sdkChecked) return; // Don't continue checking once we're done
    
    // Function to check if SDK is available
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
    
    // Try to load the SDK if it's not already available
    const loadSDK = async () => {
      if (checkSDK()) return;
      
      try {
        await ensureCreatomateSDK();
        console.log('SDK loaded successfully');
        setSDKChecked(true);
      } catch (err) {
        console.error('Error loading SDK:', err);
        setLoadAttempts(prev => prev + 1);
      }
    };
    
    // First check immediately
    if (checkSDK()) return;
    
    // If not found, try to load it
    loadSDK();
    
    // If still not loaded after loading attempt, increase attempt counter
    const timer = setTimeout(() => {
      if (checkSDK()) return;
      
      // If we've reached the max attempts and it hasn't been shown yet this session
      if (loadAttempts >= MAX_ATTEMPTS - 1 && !toastShownRef.current) {
        toast.error('Video editor components may not work properly', {
          description: 'Please refresh the page or check your internet connection.',
          id: 'sdk-load-error', // Use an ID to prevent duplicate toasts
          duration: 5000,
        });
        
        // Mark the toast as shown for this component instance and this session
        toastShownRef.current = true;
        sessionStorage.setItem('creatomate-sdk-toast-shown', 'true');
        setSDKChecked(true); // Stop checking after max attempts
      } else if (loadAttempts < MAX_ATTEMPTS - 1) {
        // Try again
        setLoadAttempts(prev => prev + 1);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [loadAttempts, sdkChecked]);

  // This component doesn't render anything visible
  return null;
}
