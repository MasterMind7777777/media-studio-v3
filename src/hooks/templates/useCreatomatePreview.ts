
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Creatomate?: any;
  }
}

interface UseCreatomatePreviewOptions {
  templateId?: string;
  variables?: Record<string, any>;
  containerRef: React.RefObject<HTMLDivElement>;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export function useCreatomatePreview({
  templateId,
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
      const script = document.createElement('script');
      script.id = 'creatomate-sdk';
      script.src = 'https://cdn.jsdelivr.net/npm/creatomate@1.2.1/dist/index.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Creatomate SDK loaded successfully');
        sdkLoadedRef.current = true;
        initializePlayer();
      };
      
      script.onerror = () => {
        console.error('Failed to load Creatomate SDK');
        setError('Failed to load preview SDK. Please try again later.');
      };
      
      document.body.appendChild(script);
    } else if (window.Creatomate) {
      sdkLoadedRef.current = true;
      initializePlayer();
    }
    
    return () => {
      // Cleanup
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (e) {
          console.error('Error disposing player:', e);
        }
      }
    };
  }, []);
  
  // Initialize or update player when templateId or variables change
  useEffect(() => {
    if (sdkLoadedRef.current && templateId) {
      initializePlayer();
    }
  }, [templateId, JSON.stringify(variables)]);
  
  const initializePlayer = async () => {
    if (!window.Creatomate || !templateId || !containerRef.current) {
      return;
    }
    
    try {
      console.log('Initializing Creatomate player with template ID:', templateId);
      
      // Dispose existing player if any
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.error('Error disposing existing player:', e);
        }
      }
      
      // Create new player instance
      playerRef.current = new window.Creatomate.Player(containerRef.current, {
        source: {
          template_id: templateId,
          modifications: variables || {},
        },
        autoPlay,
        loop,
        muted,
      });
      
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
        setError('Failed to load preview. Please check your template configuration.');
        setIsLoaded(false);
      });
      
    } catch (e) {
      console.error('Error initializing Creatomate player:', e);
      setError('Failed to initialize preview.');
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
        playerRef.current.setModifications(newVariables);
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
