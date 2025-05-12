
import { useEffect, useRef, useState } from 'react';
import { 
  CREATOMATE_PUBLIC_API_KEY, 
  formatVariablesForPlayer,
  MAX_INITIALIZATION_RETRIES,
  SDK_INITIALIZATION_DELAY,
  RETRY_DELAY,
  isCreatomateSDKAvailable,
  waitForCreatomateSDK
} from '@/integrations/creatomate/config';

declare global {
  interface Window {
    Creatomate?: any;
  }
}

interface UseCreatomatePreviewOptions {
  creatomateTemplateId?: string;
  variables?: Record<string, any>;
  containerRef: React.RefObject<HTMLDivElement>;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export function useCreatomatePreview({
  creatomateTemplateId,
  variables,
  containerRef,
  autoPlay = false,
  loop = true,
  muted = true,
}: UseCreatomatePreviewOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const sdkLoadedRef = useRef(false);
  const initializationAttempts = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const sdkCheckInterval = useRef<number | null>(null);
  const isInitializingRef = useRef(false);

  // Function to check SDK and initialize the player when ready
  const initializePlayerWhenReady = async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializingRef.current) {
      console.log('Player initialization already in progress...');
      return;
    }
    
    isInitializingRef.current = true;
    setError(null); // Clear previous errors

    try {
      // Try to wait for the SDK to load
      await waitForCreatomateSDK();
      sdkLoadedRef.current = true;
      
      // After SDK is loaded, give it a moment before initializing the player
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        if (creatomateTemplateId && containerRef.current) {
          initializePlayer();
        } else {
          const missingParts = [];
          if (!creatomateTemplateId) missingParts.push('template ID');
          if (!containerRef.current) missingParts.push('container element');
          
          const errorMsg = `Cannot initialize player: Missing ${missingParts.join(' and ')}`;
          console.error(errorMsg);
          setError(errorMsg);
        }
        isInitializingRef.current = false;
      }, SDK_INITIALIZATION_DELAY);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SDK loading error';
      console.error('Failed to load Creatomate SDK:', errorMessage);
      setError(`SDK loading error: ${errorMessage}`);
      isInitializingRef.current = false;
      
      // If we have retries left, try again after delay
      if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
        console.log(`Will retry initialization in ${RETRY_DELAY}ms (attempt ${initializationAttempts.current + 1}/${MAX_INITIALIZATION_RETRIES})`);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(initializePlayerWhenReady, RETRY_DELAY);
      }
    }
  };
  
  // Initialization function for the player
  const initializePlayer = () => {
    // Check if we've tried too many times already
    if (initializationAttempts.current >= MAX_INITIALIZATION_RETRIES) {
      console.error(`Failed to initialize player after ${MAX_INITIALIZATION_RETRIES} attempts`);
      setError(`Failed to initialize player after ${MAX_INITIALIZATION_RETRIES} attempts. Please reload the page.`);
      return;
    }
    
    initializationAttempts.current++;
    console.log(`Initialization attempt #${initializationAttempts.current}`);
    
    if (!isCreatomateSDKAvailable()) {
      const errorMsg = 'Creatomate SDK not loaded. Please reload the page.';
      console.error(errorMsg);
      setError(errorMsg);
      
      // Try again after a delay
      if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(initializePlayerWhenReady, RETRY_DELAY);
      }
      return;
    }
    
    if (!creatomateTemplateId) {
      const errorMsg = 'Missing Creatomate template ID. Please check template configuration.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    if (!containerRef.current) {
      const errorMsg = 'Player container not found. Please check your UI layout.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      console.log('Initializing Creatomate player with template ID:', creatomateTemplateId);
      console.log('API key:', CREATOMATE_PUBLIC_API_KEY ? 'Valid (hidden for security)' : 'Missing');
      
      // Dispose existing player if any
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.error('Error disposing existing player:', e);
        }
      }
      
      // Format variables properly for the player
      const formattedVariables = formatVariablesForPlayer(variables);
      
      // Log critical details for debugging
      console.log('Player initialization details:', {
        hasSDK: isCreatomateSDKAvailable(),
        hasContainer: !!containerRef.current,
        hasTemplateId: !!creatomateTemplateId,
        containerWidth: containerRef.current?.clientWidth,
        containerHeight: containerRef.current?.clientHeight,
      });
      
      // Create player configuration based on Creatomate documentation
      const playerOptions = {
        apiKey: CREATOMATE_PUBLIC_API_KEY,
        source: {
          template_id: creatomateTemplateId,
          modifications: formattedVariables,
        },
        autoPlay,
        loop,
        muted,
      };
      
      console.log('Player options:', {
        ...playerOptions,
        apiKey: 'Valid (hidden for security)',
      });
      
      // Create new player instance
      playerRef.current = new window.Creatomate.Player(containerRef.current, playerOptions);
      
      playerRef.current.on('loaded', () => {
        console.log('Creatomate player loaded successfully');
        setIsLoaded(true);
        setError(null);
        
        if (autoPlay) {
          setIsPlaying(true);
        }
      });
      
      playerRef.current.on('play', () => {
        setIsPlaying(true);
      });
      
      playerRef.current.on('pause', () => {
        setIsPlaying(false);
      });
      
      playerRef.current.on('error', (e: any) => {
        const errorMessage = e?.message || 'Unknown error';
        console.error('Creatomate player error:', e, errorMessage);
        setError(`Preview error: ${errorMessage}`);
        setIsLoaded(false);
        
        // Try to reinitialize on certain errors
        if (errorMessage.includes('network') || errorMessage.includes('connection') || 
            errorMessage.includes('failed') || errorMessage.includes('template')) {
          if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
            console.log('Attempting to reinitialize player due to error...');
            // Add a delay before retrying
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(initializePlayerWhenReady, RETRY_DELAY);
          }
        }
      });
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('Error initializing Creatomate player:', e);
      setError(`Initialization error: ${errorMessage}`);
      setIsLoaded(false);
      
      // Try again after a delay if it's not the last attempt
      if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
        console.log('Retrying player initialization...');
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(initializePlayerWhenReady, RETRY_DELAY);
      }
    }
  };
  
  // Initialization effect
  useEffect(() => {
    // Clear previous errors when dependencies change
    setError(null);
    setIsLoaded(false);
    
    // Reset initialization attempts when template ID changes
    if (creatomateTemplateId) {
      initializationAttempts.current = 0;
      console.log('Starting player initialization for template:', creatomateTemplateId);
      initializePlayerWhenReady();
    }
    
    return () => {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Clear the SDK check interval
      if (sdkCheckInterval.current) {
        window.clearInterval(sdkCheckInterval.current);
        sdkCheckInterval.current = null;
      }
      
      // Cleanup
      if (playerRef.current) {
        try {
          console.log('Disposing Creatomate player');
          playerRef.current.dispose();
          playerRef.current = null;
          initializationAttempts.current = 0;
        } catch (e) {
          console.error('Error disposing player:', e);
        }
      }
    };
  }, [creatomateTemplateId]);
  
  // Update variables effect
  useEffect(() => {
    if (isLoaded && playerRef.current && variables) {
      try {
        console.log('Updating player variables:', variables);
        const formattedVariables = formatVariablesForPlayer(variables);
        playerRef.current.setModifications(formattedVariables);
      } catch (e) {
        console.error('Error updating variables:', e);
      }
    }
  }, [variables, isLoaded]);
  
  // Player control functions
  const play = () => {
    if (playerRef.current && isLoaded) {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const pause = () => {
    if (playerRef.current && isLoaded) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };
  
  // Update player with new variables without reinitializing
  const updateVariables = (newVariables: Record<string, any>) => {
    if (playerRef.current && isLoaded) {
      try {
        const formattedVariables = formatVariablesForPlayer(newVariables);
        playerRef.current.setModifications(formattedVariables);
      } catch (e) {
        console.error('Error updating variables:', e);
      }
    }
  };

  // Helper to check initialization status (for debugging)
  const getInitializationStatus = () => {
    return {
      sdkLoaded: sdkLoadedRef.current,
      hasWindow: typeof window !== 'undefined',
      hasCreatomateSDK: isCreatomateSDKAvailable(),
      hasContainer: !!containerRef.current,
      hasTemplateId: !!creatomateTemplateId,
      hasPlayer: !!playerRef.current,
      apiKey: CREATOMATE_PUBLIC_API_KEY ? 'Valid' : 'Missing',
      attempts: initializationAttempts.current,
      initializing: isInitializingRef.current,
    };
  };

  // Force a retry of initialization
  const retryInitialization = () => {
    console.log('Manually triggering player initialization retry');
    // Reset initialization state
    isInitializingRef.current = false;
    if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
      initializePlayerWhenReady();
    } else {
      // Reset counter for manual retries
      initializationAttempts.current = 0;
      initializePlayerWhenReady();
    }
  };

  return {
    isLoaded,
    isPlaying,
    error,
    play,
    pause,
    toggle,
    updateVariables,
    getInitializationStatus,
    retryInitialization
  };
}
