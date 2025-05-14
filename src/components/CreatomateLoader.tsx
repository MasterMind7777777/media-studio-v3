
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Standardize SDK availability detection
const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

export function CreatomateLoader() {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Skip loading if disabled via env variable
    if (isCreatomateDisabled) {
      console.info('Creatomate SDK is disabled via environment variables');
      return;
    }
    
    // Prevent duplicate loading
    if (window.creatomate || loading || loaded) {
      return;
    }
    
    const loadSDK = async () => {
      try {
        setLoading(true);
        
        // Create a script element for ES module
        const script = document.createElement('script');
        script.src = 'https://cdn.creatomate.com/js/sdk/0.0.24/creatomate-preview-sdk.min.js';
        script.type = 'module';
        script.async = true;
        script.defer = true;
        
        // Create a promise that resolves when the script loads
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = (e) => reject(new Error('Failed to load Creatomate SDK script'));
        });
        
        // Add the script to the DOM
        document.body.appendChild(script);
        
        // Wait for the script to load
        await loadPromise;
        
        // Ensure the SDK is available
        if (!window.creatomate) {
          throw new Error('Creatomate SDK loaded but not available in window');
        }
        
        console.info('✓ Creatomate SDK loaded');
        setLoaded(true);
      } catch (err) {
        console.error('Error loading Creatomate SDK:', err);
        setError(err instanceof Error ? err.message : 'Unknown error loading SDK');
      } finally {
        setLoading(false);
      }
    };
    
    loadSDK();
    
    // Cleanup function to handle component unmount
    return () => {
      // Nothing specific to clean up for script loading
    };
  }, []);
  
  // Show error in UI if loading fails
  useEffect(() => {
    if (error) {
      toast.error(`Failed to load preview: ${error}`);
    }
  }, [error]);
  
  // This component doesn't render anything visible
  return null;
}
