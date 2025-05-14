
/// <reference types="vite/client" />

// Import Creatomate types directly from the module
import type { Preview as CreatomatePreview } from '@creatomate/preview';

// Define window.Creatomate for backward compatibility with tests
interface CreatomateNamespace {
  Preview: typeof CreatomatePreview;
}

// Extend the Preview type to include the methods we're using
declare module '@creatomate/preview' {
  interface Preview {
    addEventListener(event: string, callback: Function): void;
    isPlaying?: () => boolean;
    play(): void;
    pause(): void;
    setModifications(modifications: Record<string, any>): void;
    dispose(): void;
  }
}

// Extend the Window interface
declare global {
  interface Window {
    Creatomate?: CreatomateNamespace;
  }
}
