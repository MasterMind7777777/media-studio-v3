
/// <reference types="vite/client" />

// Add Creatomate global type definitions
interface CreatomatePreviewSDK {
  Preview: new (config: {
    token: string;
    templateId?: string;
    container: HTMLElement;
    format?: string;
    mode?: 'player' | 'interactive';
    modifications?: Record<string, any>;
  }) => {
    on: (event: string, callback: (data?: any) => void) => void;
    isPlaying: () => boolean;
    play: () => void;
    pause: () => void;
    loadTemplate: (templateId: string) => Promise<void>;
    setModifications: (modifications: Record<string, any>) => void;
    setTime: (time: number) => Promise<void>;
    dispose: () => void;
  };
}

// Extend Window interface to include Creatomate property
interface Window {
  Creatomate?: CreatomatePreviewSDK;
}

