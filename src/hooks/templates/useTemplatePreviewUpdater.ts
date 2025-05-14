import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [variables, setVariables] = useState<Record<string, any>>(normalizeKeys(initialVariables));
  // Track if changes are in progress
  const [isUpdating, setIsUpdating] = useState(false);
  // Track selected media
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  // Keep a ref to the latest variables to avoid closure issues
  const latestVariables = useRef(variables);
  
  // Update the ref when variables change
  useEffect(() => {
    latestVariables.current = variables;
  }, [variables]);
  
  // Initialize variables when initial values change
  useEffect(() => {
    if (Object.keys(initialVariables).length > 0) {
      console.log('Initializing template variables:', initialVariables);
      // Normalize the initial variables to ensure consistent format
      const normalizedVars = normalizeKeys(initialVariables);
      console.log('Normalized initial variables:', normalizedVars);
      setVariables(normalizedVars);
      
      // Extract any media assets that are already set
      const initialMedia: Record<string, MediaAsset> = {};
      Object.entries(normalizedVars).forEach(([key, value]) => {
        if (key.includes('.source') && typeof value === 'string' && value.startsWith('http')) {
          // Create a simple MediaAsset object from the URL
          initialMedia[key] = {
            id: key,
            name: key.split('.')[0],
            file_url: value,
            file_type: 'image', // Assume image for now
            created_at: new Date().toISOString(),
            user_id: '',
            file_size: 0,
            metadata: {}
          };
        }
      });
      
      if (Object.keys(initialMedia).length > 0) {
        setSelectedMedia(initialMedia);
      }
    }
  }, [JSON.stringify(initialVariables)]);
  
  // Helper to ensure key has correct format
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
  
  // Handle text variable changes
  const handleTextChange = useCallback((key: string, value: string) => {
    // Ensure key has correct format
    const normalizedKey = normalizeKey(key, 'text');
    console.log(`Text variable changed: ${key} -> ${normalizedKey} = "${value}"`);
    
    setIsUpdating(true);
    
    setVariables(prev => {
      const newVars = { ...prev, [normalizedKey]: value };
      // Notify parent component about the update
      onPreviewUpdate?.(newVars);
      return newVars;
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate, normalizeKey]);
  
  // Handle color variable changes
  const handleColorChange = useCallback((key: string, value: string) => {
    // Ensure key has correct format
    const normalizedKey = normalizeKey(key, 'fill');
    console.log(`Color variable changed: ${key} -> ${normalizedKey} = "${value}"`);
    
    setIsUpdating(true);
    
    setVariables(prev => {
      const newVars = { ...prev, [normalizedKey]: value };
      // Notify parent component about the update
      onPreviewUpdate?.(newVars);
      return newVars;
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate, normalizeKey]);
  
  // Handle media asset selection
  const handleMediaSelected = useCallback((key: string, asset: MediaAsset) => {
    // Ensure key has correct format
    const normalizedKey = normalizeKey(key, 'source');
    console.log(`Media selected for ${key} -> ${normalizedKey}:`, asset);
    
    setSelectedMedia(prev => ({
      ...prev,
      [normalizedKey]: asset
    }));
    
    setIsUpdating(true);
    setVariables(prev => {
      const newVars = { 
        ...prev, 
        [normalizedKey]: asset.file_url 
      };
      // Notify parent component about the update
      onPreviewUpdate?.(newVars);
      return newVars;
    });
    
    // Toast notification for better UX
    toast({
      title: "Media updated",
      description: asset.name
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
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
