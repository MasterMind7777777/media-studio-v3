
// This tells TypeScript that there will be a Preview global from UMD build
interface Window {
  Preview?: any; // Using 'any' since we don't have direct access to the @creatomate/preview types
}

// Custom events for SDK loading
interface CreatomateSDKReadyEvent extends CustomEvent {
  type: 'creatomate-sdk-ready';
}

interface CreatomateSDKErrorEvent extends Event {
  detail: {
    error: Error;
  };
}

declare global {
  interface WindowEventMap {
    'creatomate-sdk-ready': CreatomateSDKReadyEvent;
    'creatomate-sdk-error': CreatomateSDKErrorEvent;
    'creatomate-sdk-loaded': CustomEvent;
  }
}
