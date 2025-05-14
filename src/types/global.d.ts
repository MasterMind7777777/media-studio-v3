
interface Window {
  Creatomate?: {
    Preview: new (options: any) => any;
  };
  __CREATOMATE_SDK_LOADED__?: boolean;
}

// Custom events for SDK loading
interface CreatomateSDKReadyEvent extends CustomEvent {
  type: 'creatomate-sdk-ready';
}

interface CreatomateSDKErrorEvent extends CustomEvent {
  type: 'creatomate-sdk-error';
  detail: { error: Error };
}

declare global {
  interface WindowEventMap {
    'creatomate-sdk-ready': CreatomateSDKReadyEvent;
    'creatomate-sdk-error': CreatomateSDKErrorEvent;
  }
}
