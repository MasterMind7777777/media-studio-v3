
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Component that would normally load the Creatomate SDK
 * Currently disabled for development/debugging purposes
 */
export function CreatomateLoader() {
  // Set a flag in session storage to indicate SDK is disabled
  useEffect(() => {
    sessionStorage.setItem('creatomate-sdk-disabled', 'true');
    console.log('Creatomate SDK loading has been disabled for development');
  }, []);

  // This component is now effectively a no-op
  return null;
}
