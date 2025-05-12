
import { useEffect, useRef, useState } from 'react';
import { 
  CREATOMATE_PUBLIC_API_KEY, 
  formatVariablesForPlayer, 
  CREATOMATE_SDK_URL,
  MAX_INITIALIZATION_RETRIES,
  SDK_INITIALIZATION_DELAY
} from '@/integrations/creatomate/config';

declare global {
  interface Window {
    Creatomate?: any;
  }
}

interface UseCreatomatePreviewOptions {
  creatomateTemplateId?: string; // This should be the Creatomate template ID, not our database ID
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

  // Load the Creatomate SDK
  useEffect(() => {
    // Clear previous errors when dependencies change
    setError(null);
    
    const loadSdk = () => {
      if (!sdkLoadedRef.current && !window.Creatomate && !document.getElementById('creatomate-sdk')) {
        console.log('Loading Creatomate SDK...');
        const script = document.createElement('script');
        script.id = 'creatomate-sdk';
        script.src = CREATOMATE_SDK_URL;
        script.async = true;
        
        script.onload = () => {
          console.log('Creatomate SDK loaded successfully');
          sdkLoadedRef.current = true;
          
          // Add a small delay before initializing to ensure SDK is fully ready
          if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
          timeoutRef.current = window.setTimeout(() => {
            if (creatomateTemplateId && containerRef.current) {
              initializePlayer();
            } else {
              console.log('Cannot initialize player yet:', { 
                templateId: !!creatomateTemplateId, 
                container: !!containerRef.current 
              });
            }
          }, SDK_INITIALIZATION_DELAY);
        };
        
        script.onerror = (e) => {
          console.error('Failed to load Creatomate SDK:', e);
          setError('Failed to load preview SDK. Please try again later.');
        };
        
        document.body.appendChild(script);
      } else if (window.Creatomate && creatomateTemplateId && containerRef.current) {
        sdkLoadedRef.current = true;
        
        // Also use a small delay for consistency
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          initializePlayer();
        }, SDK_INITIALIZATION_DELAY);
      }
    };

    loadSdk();
    
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
          initializationAttempts.current = 0;
        } catch (e) {
          console.error('Error disposing player:', e);
        }
      }
    };
  }, [creatomateTemplateId]);
  
  // Initialize or update player when variables change
  useEffect(() => {
    if (sdkLoadedRef.current && creatomateTemplateId && containerRef.current && playerRef.current && isLoaded) {
      try {
        console.log('Updating player variables:', variables);
        const formattedVariables = formatVariablesForPlayer(variables);
        playerRef.current.setModifications(formattedVariables);
      } catch (e) {
        console.error('Error updating variables:', e);
      }
    }
  }, [variables, JSON.stringify(variables), isLoaded]);
  
  const initializePlayer = () => {
    // Check if we've tried too many times already
    if (initializationAttempts.current >= MAX_INITIALIZATION_RETRIES) {
      console.error(`Failed to initialize player after ${MAX_INITIALIZATION_RETRIES} attempts`);
      setError(`Failed to initialize player after ${MAX_INITIALIZATION_RETRIES} attempts. Please reload the page.`);
      return;
    }
    
    initializationAttempts.current++;
    console.log(`Initialization attempt #${initializationAttempts.current}`);
    
    if (!window.Creatomate) {
      const errorMsg = 'Creatomate SDK not loaded. Please reload the page.';
      console.error(errorMsg);
      setError(errorMsg);
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
      
      console.log('Player options:', playerOptions);
      
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
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
            console.log('Attempting to reinitialize player due to network error...');
            // Add a delay before retrying
            setTimeout(initializePlayer, 1000);
          }
        }
      });
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('Error initializing Creatomate player:', e);
      setError(`Initialization error: ${errorMessage}`);
      setIsLoaded(false);
      
      // Try once more after a delay if it's not the last attempt
      if (initializationAttempts.current < MAX_INITIALIZATION_RETRIES) {
        console.log('Retrying player initialization...');
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(initializePlayer, 1000);
      }
    }
  };
  
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
      hasCreatomateSDK: typeof window !== 'undefined' && !!window.Creatomate,
      hasContainer: !!containerRef.current,
      hasTemplateId: !!creatomateTemplateId,
      hasPlayer: !!playerRef.current,
      apiKey: CREATOMATE_PUBLIC_API_KEY ? 'Valid' : 'Missing',
      attempts: initializationAttempts.current,
    };
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
  };
}
