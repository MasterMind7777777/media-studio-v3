import { useState, useEffect, useCallback } from 'react';
import { MediaAsset } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { normalizeKeys } from '@/lib/variables';

interface UseTemplatePreviewUpdaterProps {
  initialVariables: Record<string, any>;
  onPreviewUpdate?: (variables: Record<string, any>) => void;
}

/**
 * Hook for managing template preview variables with debounced updates
 * to prevent too many updates firing at once
 */
export function useTemplatePreviewUpdater({ 
  initialVariables = {}, 
  onPreviewUpdate
}: UseTemplatePreviewUpdaterProps) {
  // Store the actual state of variables
  const [variables, setVariables] = useState<Record<string, any>>(initialVariables);
  // Track if changes are in progress
  const [isUpdating, setIsUpdating] = useState(false);
  // Track selected media
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  
  // Initialize variables when initial values change
  useEffect(() => {
    if (Object.keys(initialVariables).length > 0) {
      console.log('Initializing template variables:', initialVariables);
      // Normalize the initial variables to ensure consistent format
      const normalizedVars = normalizeKeys(initialVariables);
      console.log('Normalized initial variables:', normalizedVars);
      setVariables(normalizedVars);
    }
  }, [JSON.stringify(initialVariables)]);
  
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
  }, [onPreviewUpdate]);
  
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
  }, [onPreviewUpdate]);
  
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
      title: "Updated media",
      description: asset.name
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate]);
  
  // Helper to normalize a single key
  const normalizeKey = (key: string, defaultProperty: string): string => {
    const parts = key.split('.');
    const elementName = parts[0];
    
    // If key already has property suffix, keep it
    if (parts.length > 1) {
      // Remove any duplicate suffixes (e.g., "text.text" -> "text")
      const property = parts[1];
      return `${elementName}.${property}`;
    }
    
    // Add the default property suffix if missing
    return `${elementName}.${defaultProperty}`;
  };
  
  return {
    variables,
    selectedMedia,
    isUpdating,
    handleTextChange,
    handleColorChange,
    handleMediaSelected,
    setVariables
  };
}
