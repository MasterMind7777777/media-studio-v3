
import { useState, useRef } from 'react';
import { useDebouncedCallback } from '../utils/useDebouncedCallback';
import { MediaAsset } from '@/types';

export interface UseTemplatePreviewUpdaterOptions {
  initialVariables: Record<string, any>;
  onPreviewUpdate: (variables: Record<string, any>) => void;
  debounceMs?: number;
}

/**
 * Custom hook to manage template variables and preview updates
 */
export function useTemplatePreviewUpdater({
  initialVariables = {},
  onPreviewUpdate,
  debounceMs = 100
}: UseTemplatePreviewUpdaterOptions) {
  // State for tracking variables and selected media
  const [variables, setVariables] = useState<Record<string, any>>(initialVariables);
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Keep a ref to the latest variables to ensure we're always using the most up-to-date values
  const latestVariables = useRef<Record<string, any>>(variables);
  
  // Update the ref whenever variables change
  latestVariables.current = variables;

  // Debounced update function to prevent too many rapid updates
  const debouncedUpdate = useDebouncedCallback((newVars: Record<string, any>) => {
    setIsUpdating(false);
    onPreviewUpdate(newVars);
  }, debounceMs);

  // Handle text variable changes
  const handleTextChange = (id: string, value: string) => {
    setIsUpdating(true);
    
    // Create immutable copy with new text value
    const newVars = {
      ...latestVariables.current,
      [id]: { ...latestVariables.current[id], value }
    };
    
    // Update state
    setVariables(newVars);
    
    // Trigger debounced update
    debouncedUpdate(newVars);
  };

  // Handle color variable changes
  const handleColorChange = (id: string, value: string) => {
    setIsUpdating(true);
    
    // Create immutable copy with new color value
    const newVars = {
      ...latestVariables.current,
      [id]: { ...latestVariables.current[id], value }
    };
    
    // Update state
    setVariables(newVars);
    
    // Trigger debounced update
    debouncedUpdate(newVars);
  };

  // Handle media selection
  const handleMediaSelected = (id: string, media: MediaAsset) => {
    setIsUpdating(true);
    
    // Update selected media state
    setSelectedMedia(prev => ({
      ...prev,
      [id]: media
    }));
    
    // Get the image URL from the media asset, prioritizing source_url if available
    const imageUrl = media.source_url || media.file_url || '';
    
    // Create immutable copy with new media value
    const newVars = {
      ...latestVariables.current,
      [id]: { 
        ...latestVariables.current[id], 
        value: imageUrl
      }
    };
    
    // Update state and trigger update
    setVariables(newVars);
    onPreviewUpdate(newVars); // Immediate update for media, no debounce
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
