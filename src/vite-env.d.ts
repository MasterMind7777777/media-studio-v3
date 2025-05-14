
/// <reference types="vite/client" />

// Import Creatomate types directly from the module
import type { Preview } from '@creatomate/preview';

// Define window.Creatomate for backward compatibility with tests
interface CreatomateNamespace {
  Preview: typeof Preview;
}

// Extend the Window interface
declare global {
  interface Window {
    Creatomate?: CreatomateNamespace;
  }
}
