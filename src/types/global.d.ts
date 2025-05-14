
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
