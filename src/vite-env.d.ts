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
    onReady: () => void;
    onError: (error: Error) => void;
    onTimeUpdate: (time: number) => void;
    onPlay: () => void;
    onPause: () => void;
    loadTemplate: (templateId: string) => Promise<void>;
    setModifications: (modifications: Record<string, any>) => void;
    setTime: (time: number) => Promise<void>;
    play: () => void;
    pause: () => void;
    dispose: () => void;
  };
}

// Extend Window interface to include Creatomate property
interface Window {
  Creatomate?: CreatomatePreviewSDK;
  handleCreatomateScriptError?: () => void;
}
