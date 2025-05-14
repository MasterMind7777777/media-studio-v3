
import { useState, useCallback, useEffect, useRef } from 'react';
import { MediaAsset } from '@/types';

interface TemplatePreviewUpdaterOptions {
  initialVariables: Record<string, any>;
  onPreviewUpdate?: (variables: Record<string, any>) => void;
}

export function useTemplatePreviewUpdater({
  initialVariables,
  onPreviewUpdate,
}: TemplatePreviewUpdaterOptions) {
  // Initialize state with initial variables
  const [variables, setVariables] = useState<Record<string, any>>(initialVariables || {});
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track the latest variables for debounced updates
  const latestVariables = useRef<Record<string, any>>(variables);
  
  // Update ref when variables change
  useEffect(() => {
    latestVariables.current = variables;
  }, [variables]);
  
  // Initialize selected media from initial variables
  useEffect(() => {
    if (!initialVariables) return;
    
    // Extract media assets from variables if they exist
    const mediaAssets: Record<string, MediaAsset> = {};
    
    Object.entries(initialVariables).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'file_url' in value && 'name' in value) {
        mediaAssets[key] = value as MediaAsset;
      }
    });
    
    setSelectedMedia(mediaAssets);
    setVariables(initialVariables);
  }, [initialVariables]);
  
  // Handle text variable changes
  const handleTextChange = useCallback((key: string, value: string) => {
    setIsUpdating(true);
    
    setVariables((prev) => {
      // Always create a new object to ensure proper state updates
      const updated = { ...prev, [key]: value };
      
      // Notify parent component of the update
      onPreviewUpdate?.(updated);
      
      return updated;
    });
    
    setIsUpdating(false);
  }, [onPreviewUpdate]);
  
  // Handle color variable changes
  const handleColorChange = useCallback((key: string, value: string) => {
    setIsUpdating(true);
    
    setVariables((prev) => {
      // Always create a new object to ensure proper state updates
      const updated = { ...prev, [key]: value };
      
      // Notify parent component of the update
      onPreviewUpdate?.(updated);
      
      return updated;
    });
    
    setIsUpdating(false);
  }, [onPreviewUpdate]);
  
  // Handle media selection - Fixed to use immutable updates
  const handleMediaSelected = useCallback((key: string, asset: MediaAsset) => {
    setIsUpdating(true);
    
    // Update selected media record - using immutable update
    setSelectedMedia((prev) => ({ ...prev, [key]: asset }));
    
    // Update variables with the media URL - using immutable update
    setVariables((prev) => {
      const updated = { ...prev, [key]: asset.file_url };
      
      // Notify parent component of the update
      onPreviewUpdate?.(updated);
      
      return updated;
    });
    
    setIsUpdating(false);
  }, [onPreviewUpdate]);
  
  return {
    variables,
    selectedMedia,
    isUpdating,
    setVariables,
    handleTextChange,
    handleColorChange,
    handleMediaSelected,
  };
}
