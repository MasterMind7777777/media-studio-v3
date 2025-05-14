import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MediaAsset } from '@/types';
import { toast } from 'sonner';
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
  // Store the actual state of variables - initialized once from props
  const [variables, setVariables] = useState<Record<string, any>>(() => {
    // Initialize with normalized variables
    return normalizeKeys(initialVariables);
  });
  
  // Track if changes are in progress
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track selected media
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  
  // Keep a ref to the latest variables to avoid closure issues
  const latestVariables = useRef(variables);
  
  // Flag for preventing redundant updates
  const isInitializing = useRef(false);
  
  // Update the ref when variables change
  useEffect(() => {
    latestVariables.current = variables;
    
    // Notify the parent component when variables change (but not during initialization)
    if (Object.keys(variables).length > 0 && !isInitializing.current) {
      onPreviewUpdate?.(variables);
    }
  }, [variables, onPreviewUpdate]);
  
  // Initialize media assets from initial variables
  useEffect(() => {
    if (Object.keys(initialVariables).length > 0 && !isInitializing.current) {
      console.log('Initializing template media assets');
      isInitializing.current = true;
      
      // Extract any media assets that are already set
      const initialMedia: Record<string, MediaAsset> = {};
      Object.entries(initialVariables).forEach(([key, value]) => {
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

      // Reset initializing flag
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    }
  }, [initialVariables]);
  
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
  
  // Handle text variable changes with immutable updates
  const handleTextChange = useCallback((key: string, value: string) => {
    // Ensure key has correct format
    const normalizedKey = normalizeKey(key, 'text');
    
    // Set updating flag
    setIsUpdating(true);
    
    // Immutable update to ensure proper re-rendering
    setVariables(prev => ({
      ...prev,
      [normalizedKey]: value
    }));
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 100);
  }, [normalizeKey]);
  
  // Handle color variable changes with immutable updates
  const handleColorChange = useCallback((key: string, value: string) => {
    // Ensure key has correct format
    const normalizedKey = normalizeKey(key, 'fill');
    
    // Set updating flag
    setIsUpdating(true);
    
    // Immutable update to ensure proper re-rendering
    setVariables(prev => ({
      ...prev,
      [normalizedKey]: value
    }));
    
    // Clear updating state after a short delay
    setTimeout(() => setIsUpdating(false), 100);
  }, [normalizeKey]);
  
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
      
      // Update selected media with immutable update
      setSelectedMedia(prev => ({
        ...prev,
        [normalizedKey]: asset
      }));
      
      // Update variables with immutable update
      setVariables(prev => ({
        ...prev, 
        [normalizedKey]: asset.file_url 
      }));
      
      // Toast notification for better UX
      toast.success(`Media updated: ${asset.name}`);
      
      // Clear updating state after a short delay
      setTimeout(() => setIsUpdating(false), 100);
    } catch (error) {
      console.error('Error selecting media:', error);
      setIsUpdating(false);
      toast.error("Error updating media. Please try again.");
    }
  }, [normalizeKey]);
  
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
