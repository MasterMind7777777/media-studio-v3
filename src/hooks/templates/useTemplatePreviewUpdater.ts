
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MediaAsset } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { normalizeKeys } from '@/lib/variables';

interface UseTemplatePreviewUpdaterProps {
  initialVariables: Record<string, any>;
  onPreviewUpdate?: (variables: Record<string, any>) => void;
}

/**
 * Hook for managing template preview variables with debounced updates
 */
export function useTemplatePreviewUpdater({ 
  initialVariables = {}, 
  onPreviewUpdate
}: UseTemplatePreviewUpdaterProps) {
  // Store the actual state of variables
  const [variables, setVariables] = useState<Record<string, any>>({});
  // Track if changes are in progress
  const [isUpdating, setIsUpdating] = useState(false);
  // Track selected media
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  // Keep a ref to the latest variables to avoid closure issues
  const latestVariables = useRef(variables);
  // Flag for preventing redundant updates
  const isInitializing = useRef(false);
  
  // Memoize the normalized initial variables to avoid recalculation
  const normalizedInitialVariables = useMemo(() => {
    if (Object.keys(initialVariables).length === 0) return {};
    console.log('Memoizing normalized initial variables');
    return normalizeKeys(initialVariables);
  }, [JSON.stringify(initialVariables)]);
  
  // Update the ref when variables change
  useEffect(() => {
    latestVariables.current = variables;
  }, [variables]);
  
  // Initialize variables when initial values change
  useEffect(() => {
    if (Object.keys(normalizedInitialVariables).length > 0 && !isInitializing.current) {
      console.log('Initializing template variables with normalized values');
      isInitializing.current = true;
      
      // Batch our state updates to reduce re-renders
      const batchedStateUpdates = () => {
        // Set variables state
        setVariables(normalizedInitialVariables);
        
        // Extract any media assets that are already set
        const initialMedia: Record<string, MediaAsset> = {};
        Object.entries(normalizedInitialVariables).forEach(([key, value]) => {
          if (key.includes('.source') && typeof value === 'string' && value.startsWith('http')) {
            // Create a simple MediaAsset object from the URL
            initialMedia[key] = {
              id: key,
              name: key.split('.')[0],
              file_url: value,
              file_type: 'image', // Assume image for now
              created_at: new Date().toISOString(),
              user_id: '',
              thumbnail_url: value,
              content_pack_id: null,
              metadata: {}
            };
          }
        });
        
        if (Object.keys(initialMedia).length > 0) {
          setSelectedMedia(initialMedia);
        }

        // Reset initializing flag after a small delay to prevent repeat initializations
        setTimeout(() => {
          isInitializing.current = false;
        }, 100);
      };
      
      batchedStateUpdates();
    }
  }, [normalizedInitialVariables]);
  
  // Helper to ensure key has correct format - memoized to prevent recreating on every render
  const normalizeKey = useCallback((key: string, defaultProperty: string): string => {
    const parts = key.split('.');
    const elementName = parts[0];
    
    // If key already has property suffix, keep it
    if (parts.length > 1) {
      return key; // Keep the original key if it already has a property
    }
    
    // Add the default property suffix if missing
    return `${elementName}.${defaultProperty}`;
  }, []);
  
  // Handle text variable changes with debouncing
  const handleTextChange = useCallback((key: string, value: string) => {
    // Ensure key has correct format
    const normalizedKey = normalizeKey(key, 'text');
    
    // Set updating flag
    setIsUpdating(true);
    
    // Batch update to improve performance
    setVariables(prev => {
      const newVars = { ...prev, [normalizedKey]: value };
      
      // Use timeout to debounce notification to parent component
      setTimeout(() => {
        // Use the ref to ensure we have the latest state
        onPreviewUpdate?.(newVars);
      }, 300);
      
      return newVars;
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate, normalizeKey]);
  
  // Handle color variable changes with debouncing
  const handleColorChange = useCallback((key: string, value: string) => {
    // Ensure key has correct format
    const normalizedKey = normalizeKey(key, 'fill');
    
    // Set updating flag
    setIsUpdating(true);
    
    // Batch update to improve performance
    setVariables(prev => {
      const newVars = { ...prev, [normalizedKey]: value };
      
      // Use timeout to debounce notification to parent component
      setTimeout(() => {
        onPreviewUpdate?.(newVars);
      }, 300);
      
      return newVars;
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate, normalizeKey]);
  
  // Handle media asset selection with error handling
  const handleMediaSelected = useCallback((key: string, asset: MediaAsset) => {
    try {
      // Validate asset
      if (!asset || !asset.file_url) {
        console.error('Invalid media asset received', asset);
        return;
      }
      
      // Ensure key has correct format
      const normalizedKey = normalizeKey(key, 'source');
      
      // Set updating flag
      setIsUpdating(true);
      
      // Batch our updates
      const updateMedia = () => {
        setSelectedMedia(prev => ({
          ...prev,
          [normalizedKey]: asset
        }));
        
        setVariables(prev => {
          const newVars = { 
            ...prev, 
            [normalizedKey]: asset.file_url 
          };
          
          // Notify parent component about the update after a small delay
          setTimeout(() => {
            onPreviewUpdate?.(newVars);
          }, 100);
          
          return newVars;
        });
        
        // Toast notification for better UX
        toast({
          title: "Media updated",
          description: asset.name
        });
      };
      
      updateMedia();
      
      // Clear updating state after a short delay
      setTimeout(() => setIsUpdating(false), 300);
    } catch (error) {
      console.error('Error selecting media:', error);
      setIsUpdating(false);
      toast({
        title: "Error updating media",
        description: "Please try again"
      });
    }
  }, [onPreviewUpdate, normalizeKey]);
  
  return {
    variables,
    selectedMedia,
    isUpdating,
    handleTextChange,
    handleColorChange,
    handleMediaSelected,
    setVariables,
    // Add the reference for closure safety
    variablesRef: latestVariables
  };
}
