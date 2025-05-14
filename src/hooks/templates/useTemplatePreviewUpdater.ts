import { useState, useRef, useCallback, useMemo } from 'react';
import { useDebouncedCallback } from '@/hooks/utils/useDebouncedCallback';
import { MediaAsset } from '@/types';

interface TemplatePreviewUpdaterProps {
  initialVariables: Record<string, any>;
  onPreviewUpdate: (variables: Record<string, any>) => void;
}

export function useTemplatePreviewUpdater({
  initialVariables,
  onPreviewUpdate
}: TemplatePreviewUpdaterProps) {
  const [variables, setVariables] = useState<Record<string, any>>(initialVariables);
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Keep a reference to the latest variables for debounced functions
  const latestVariables = useRef<Record<string, any>>(variables);
  
  // Update latestVariables ref when variables change
  useMemo(() => {
    latestVariables.current = variables;
  }, [variables]);
  
  // Debounced update function to prevent too many preview updates
  const debouncedUpdatePreview = useDebouncedCallback((newVars: Record<string, any>) => {
    setIsUpdating(true);
    try {
      onPreviewUpdate(newVars);
    } finally {
      setIsUpdating(false);
    }
  }, 300);
  
  // Handle text variable changes
  const handleTextChange = useCallback((id: string, value: string) => {
    setVariables(prevVars => {
      // Create a new copy of the variables object
      const newVars = { ...prevVars };
      
      // If the variable exists, create a new copy of it
      if (newVars[id]) {
        newVars[id] = { ...newVars[id], value };
      } else {
        // If it doesn't exist, create a new variable
        newVars[id] = { value };
      }
      
      // Update the preview
      debouncedUpdatePreview(newVars);
      
      return newVars;
    });
  }, [debouncedUpdatePreview]);
  
  // Handle color variable changes
  const handleColorChange = useCallback((id: string, value: string) => {
    setVariables(prevVars => {
      // Create a new copy of the variables object
      const newVars = { ...prevVars };
      
      // If the variable exists, create a new copy of it
      if (newVars[id]) {
        newVars[id] = { ...newVars[id], value };
      } else {
        // If it doesn't exist, create a new variable
        newVars[id] = { value };
      }
      
      // Update the preview
      debouncedUpdatePreview(newVars);
      
      return newVars;
    });
  }, [debouncedUpdatePreview]);
  
  // Handle media variable changes
  const handleMediaSelected = useCallback((id: string, asset: MediaAsset) => {
    // Update the selected media state
    setSelectedMedia(prev => ({
      ...prev,
      [id]: asset
    }));
    
    // Update the variables
    setVariables(prevVars => {
      // Create a new copy of the variables object
      const newVars = { ...prevVars };
      
      // If the variable exists, create a new copy of it
      if (newVars[id]) {
        newVars[id] = { 
          ...newVars[id], 
          value: asset.url 
        };
      } else {
        // If it doesn't exist, create a new variable
        newVars[id] = { value: asset.url };
      }
      
      // Update the preview immediately (no debounce needed for media)
      onPreviewUpdate(newVars);
      
      return newVars;
    });
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
