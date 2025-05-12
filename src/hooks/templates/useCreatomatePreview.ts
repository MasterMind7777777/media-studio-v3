
import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CREATOMATE_PUBLIC_API_KEY, 
  formatVariablesForPlayer,
  MAX_INITIALIZATION_RETRIES,
  SDK_INITIALIZATION_DELAY,
  BASE_RETRY_DELAY,
  isCreatomateSDKAvailable,
  waitForCreatomateSDK
} from '@/integrations/creatomate/config';

interface UseCreatomatePreviewOptions {
  creatomateTemplateId?: string;
  variables?: Record<string, any>;
  containerRef: React.RefObject<HTMLDivElement>;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  skipAutoRetry?: boolean; // Option to prevent auto-retries
}

export function useCreatomatePreview({
  creatomateTemplateId,
  variables,
  containerRef,
  autoPlay = false,
  loop = true,
  muted = true,
  skipAutoRetry = false,
}: UseCreatomatePreviewOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const sdkLoadedRef = useRef(false);
  const initializationAttempts = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const isInitializingRef = useRef(false);
  const manualRetryRef = useRef(false); // Track if this is a manual retry
  const initializationStartTimeRef = useRef<number | null>(null); // Track when initialization started

  // Calculate exponential backoff delay based on attempt number
  const getRetryDelay = useCallback((attemptNum: number) => {
    // Exponential backoff with a cap at 8 seconds
    return Math.min(BASE_RETRY_DELAY * Math.pow(1.5, attemptNum), 8000);
  }, []);
  
  // Function to check SDK and initialize the player when ready
  const initializePlayerWhenReady = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializingRef.current) {
      console.log('Player initialization already in progress...');
      return;
    }
    
    isInitializingRef.current = true;
    setError(null); // Clear previous errors
    initializationStartTimeRef.current = Date.now(); // Track when we started

    try {
      // Log detailed initialization attempt information
      console.log(`Initialization attempt #${initializationAttempts.current + 1}/${MAX_INITIALIZATION_RETRIES}`);
      console.log(`SDK available before waiting: ${isCreatomateSDKAvailable() ? 'Yes' : 'No'}`);
      
      // Try to wait for the SDK to load with longer timeout
      await waitForCreatomateSDK();
      sdkLoadedRef.current = true;
      
      console.log(`SDK available after waiting: ${isCreatomateSDKAvailable() ? 'Yes' : 'No'}`);
      
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
      
      // Calculate time spent trying to load
      const timeSpent = initializationStartTimeRef.current 
        ? Date.now() - initializationStartTimeRef.current 
        : 0;
      
      console.log(`Time spent attempting to load SDK: ${timeSpent}ms`);
      setError(`SDK loading error: ${errorMessage}`);
      isInitializingRef.current = false;
      
      // If we have retries left and not skipping auto-retry, try again after delay
      if (!skipAutoRetry && initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
        initializationAttempts.current++;
        const retryDelay = getRetryDelay(initializationAttempts.current);
        console.log(`Will retry initialization in ${retryDelay}ms (attempt ${initializationAttempts.current}/${MAX_INITIALIZATION_RETRIES})`);
        
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(initializePlayerWhenReady, retryDelay);
      }
    }
  }, [creatomateTemplateId, skipAutoRetry, getRetryDelay]);
  
  // Initialization function for the player
  const initializePlayer = useCallback(() => {
    // Check if we've tried too many times already and not a manual retry
    if (!manualRetryRef.current && initializationAttempts.current >= MAX_INITIALIZATION_RETRIES) {
      console.error(`Failed to initialize player after ${MAX_INITIALIZATION_RETRIES} attempts`);
      setError(`Failed to initialize player after ${MAX_INITIALIZATION_RETRIES} attempts. Please try the manual refresh button.`);
      return;
    }
    
    // Update the attempt counter
    if (!manualRetryRef.current) {
      initializationAttempts.current++;
    }
    
    console.log(`Creating player instance (attempt #${initializationAttempts.current})`);
    
    // Double-check SDK availability
    if (!isCreatomateSDKAvailable()) {
      const errorMsg = 'Creatomate SDK not available for initialization. Please reload the page.';
      console.error(errorMsg, 'window.Creatomate:', window.Creatomate);
      setError(errorMsg);
      
      // Try again after a delay if not skipping auto retry
      if (!skipAutoRetry && initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
        const retryDelay = getRetryDelay(initializationAttempts.current);
        console.log(`Will retry initialization in ${retryDelay}ms`);
        
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(initializePlayerWhenReady, retryDelay);
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
      
      // Log player options (except API key for security)
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
        
        // Try to reinitialize on certain errors if not skipping auto retries
        if (!skipAutoRetry && 
            (errorMessage.includes('network') || errorMessage.includes('connection') || 
            errorMessage.includes('failed') || errorMessage.includes('template'))) {
          if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
            const retryDelay = getRetryDelay(initializationAttempts.current);
            console.log(`Attempting to reinitialize player due to error in ${retryDelay}ms...`);
            
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(initializePlayerWhenReady, retryDelay);
          }
        }
      });
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('Error initializing Creatomate player:', e);
      setError(`Initialization error: ${errorMessage}`);
      setIsLoaded(false);
      
      // Try again after a delay if it's not the last attempt and not skipping auto retries
      if (!skipAutoRetry && initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
        const retryDelay = getRetryDelay(initializationAttempts.current);
        console.log(`Retrying player initialization in ${retryDelay}ms...`);
        
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(initializePlayerWhenReady, retryDelay);
      }
    }
  }, [creatomateTemplateId, variables, autoPlay, loop, muted, skipAutoRetry, getRetryDelay]);
  
  // Initialization effect - run only once on mount
  useEffect(() => {
    // Clear previous errors
    setError(null);
    setIsLoaded(false);
    
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
      
      // Cleanup
      if (playerRef.current) {
        try {
          console.log('Disposing Creatomate player');
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (e) {
          console.error('Error disposing player:', e);
        }
      }
      
      // Reset initialization state
      initializationAttempts.current = 0;
    };
  }, []); // Intentionally empty dependencies - we don't want this to re-run
  
  // Handle template ID changes
  useEffect(() => {
    if (creatomateTemplateId) {
      // Only try to initialize if we don't have a player or if it's not loaded
      if (!playerRef.current || !isLoaded) {
        console.log('Template ID changed or player not loaded, initializing player');
        // We only reset the attempts if this is a new template ID, not just a retry
        if (playerRef.current === null) {
          initializationAttempts.current = 0;
        }
        initializePlayerWhenReady();
      }
    }
  }, [creatomateTemplateId, isLoaded, initializePlayerWhenReady]);
  
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
  const play = useCallback(() => {
    if (playerRef.current && isLoaded) {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, [isLoaded]);
  
  const pause = useCallback(() => {
    if (playerRef.current && isLoaded) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  }, [isLoaded]);
  
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);
  
  // Update player with new variables without reinitializing
  const updateVariables = useCallback((newVariables: Record<string, any>) => {
    if (playerRef.current && isLoaded) {
      try {
        const formattedVariables = formatVariablesForPlayer(newVariables);
        playerRef.current.setModifications(formattedVariables);
      } catch (e) {
        console.error('Error updating variables:', e);
      }
    }
  }, [isLoaded]);

  // Helper to check initialization status (for debugging)
  const getInitializationStatus = useCallback(() => {
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
  }, [creatomateTemplateId]);

  // Force a retry of initialization
  const retryInitialization = useCallback(() => {
    console.log('Manually triggering player initialization retry');
    // Reset initialization state for manual retry
    isInitializingRef.current = false;
    manualRetryRef.current = true; // Mark as manual retry
    initializationAttempts.current = 0; // Reset counter for manual retries
    setError(null); // Clear previous errors
    initializePlayerWhenReady();
    // Reset the manual flag after a short delay
    setTimeout(() => {
      manualRetryRef.current = false;
    }, 5000);
  }, [initializePlayerWhenReady]);

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
