
import { useEffect, useRef, useState } from 'react';
import { CREATOMATE_PUBLIC_API_KEY, formatVariablesForPlayer } from '@/integrations/creatomate/config';

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

  // Load the Creatomate SDK
  useEffect(() => {
    if (!sdkLoadedRef.current && !window.Creatomate && !document.getElementById('creatomate-sdk')) {
      console.log('Loading Creatomate SDK...');
      const script = document.createElement('script');
      script.id = 'creatomate-sdk';
      script.src = 'https://cdn.jsdelivr.net/npm/creatomate@1.2.1/dist/index.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Creatomate SDK loaded successfully');
        sdkLoadedRef.current = true;
        if (creatomateTemplateId && containerRef.current) {
          initializePlayer();
        }
      };
      
      script.onerror = (e) => {
        console.error('Failed to load Creatomate SDK:', e);
        setError('Failed to load preview SDK. Please try again later.');
      };
      
      document.body.appendChild(script);
    } else if (window.Creatomate && creatomateTemplateId && containerRef.current) {
      sdkLoadedRef.current = true;
      initializePlayer();
    }
    
    return () => {
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
    };
  }, [creatomateTemplateId]);
  
  // Initialize or update player when variables change
  useEffect(() => {
    if (sdkLoadedRef.current && creatomateTemplateId && containerRef.current && playerRef.current) {
      try {
        console.log('Updating player variables:', variables);
        const formattedVariables = formatVariablesForPlayer(variables);
        playerRef.current.setModifications(formattedVariables);
      } catch (e) {
        console.error('Error updating variables:', e);
      }
    }
  }, [variables, JSON.stringify(variables)]);
  
  const initializePlayer = () => {
    if (!window.Creatomate || !creatomateTemplateId || !containerRef.current) {
      console.log('Cannot initialize player:', { 
        sdkLoaded: !!window.Creatomate,
        templateId: creatomateTemplateId,
        containerRef: !!containerRef.current
      });
      setError('Missing required configuration to initialize preview');
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
      
      // Create player configuration based on tutorial approach
      const playerOptions = {
        apiKey: CREATOMATE_PUBLIC_API_KEY,
        source: {
          template_id: creatomateTemplateId,
          modifications: formatVariablesForPlayer(variables),
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
        console.error('Creatomate player error:', e);
        setError(`Preview error: ${e.message || 'Unknown error'}`);
        setIsLoaded(false);
      });
      
    } catch (e) {
      console.error('Error initializing Creatomate player:', e);
      setError(`Initialization error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setIsLoaded(false);
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

  return {
    isLoaded,
    isPlaying,
    error,
    play,
    pause,
    toggle,
    updateVariables,
  };
}
