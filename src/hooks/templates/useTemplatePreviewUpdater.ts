
import { useState, useEffect, useCallback } from 'react';
import { MediaAsset } from '@/types';
import { toast } from 'sonner';

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
      setVariables(initialVariables);
    }
  }, [JSON.stringify(initialVariables)]);
  
  // Handle text variable changes
  const handleTextChange = useCallback((key: string, value: string) => {
    console.log(`Text variable changed: ${key} = "${value}"`);
    setIsUpdating(true);
    
    setVariables(prev => {
      const newVars = { ...prev, [key]: value };
      // Notify parent component about the update
      onPreviewUpdate?.(newVars);
      return newVars;
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate]);
  
  // Handle color variable changes
  const handleColorChange = useCallback((key: string, value: string) => {
    console.log(`Color variable changed: ${key} = "${value}"`);
    setIsUpdating(true);
    
    setVariables(prev => {
      const newVars = { ...prev, [key]: value };
      // Notify parent component about the update
      onPreviewUpdate?.(newVars);
      return newVars;
    });
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate]);
  
  // Handle media asset selection
  const handleMediaSelected = useCallback((key: string, asset: MediaAsset) => {
    console.log(`Media selected for ${key}:`, asset);
    
    setSelectedMedia(prev => ({
      ...prev,
      [key]: asset
    }));
    
    setIsUpdating(true);
    setVariables(prev => {
      const newVars = { 
        ...prev, 
        [key]: asset.file_url 
      };
      // Notify parent component about the update
      onPreviewUpdate?.(newVars);
      return newVars;
    });
    
    // Toast notification for better UX
    toast.success(`Updated ${asset.name}`);
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 300);
  }, [onPreviewUpdate]);
  
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
