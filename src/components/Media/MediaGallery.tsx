
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaAssets } from "@/hooks/api";
import { MediaAsset } from "@/types";
import { Image, Film, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { QueryOptions } from "@tanstack/react-query";

interface MediaGalleryProps {
  contentPackId?: string;
  onMediaSelect?: (media: MediaAsset) => void;
  selectedMediaId?: string;
  mediaAssets?: MediaAsset[];
  isLoading?: boolean;
}

export function MediaGallery({ 
  contentPackId, 
  onMediaSelect, 
  selectedMediaId,
  mediaAssets: propMediaAssets,
  isLoading: propIsLoading
}: MediaGalleryProps) {
  // Only fetch from API if mediaAssets weren't provided as props
  const { data: fetchedMediaAssets, isLoading: isFetching, error } = useMediaAssets(
    contentPackId, 
    { enabled: propMediaAssets === undefined } // Fixed enabled property type issue
  );
  
  // Use either provided media assets or fetched ones
  const mediaAssets = propMediaAssets || fetchedMediaAssets;
  
  // Track loading state with minimum display time
  const [showLoading, setShowLoading] = useState(propIsLoading !== undefined ? propIsLoading : isFetching);
  
  useEffect(() => {
    // If loading starts, show immediately
    if (propIsLoading !== undefined ? propIsLoading : isFetching) {
      setShowLoading(true);
      return;
    }
    
    // If loading ends, ensure it shows for at least 500ms to prevent flashing
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [propIsLoading, isFetching]);
  
  const handleSelectMedia = (media: MediaAsset) => {
    if (onMediaSelect) {
      onMediaSelect(media);
    }
  };
  
  if (showLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load media assets</p>
        <p className="text-muted-foreground text-sm mt-2">{(error as Error).message}</p>
      </div>
    );
  }
  
  if (!mediaAssets || (mediaAssets as MediaAsset[]).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No uploads yet</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {(mediaAssets as MediaAsset[]).map((media) => (
        <Card 
          key={media.id} 
          className={`cursor-pointer overflow-hidden ${
            selectedMediaId === media.id ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
          onClick={() => handleSelectMedia(media)}
        >
          <div className="aspect-square relative">
            {media.file_type === 'image' ? (
              <img 
                src={media.thumbnail_url || media.file_url} 
                alt={media.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/5">
                <Film className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="p-2">
            <h3 className="font-medium text-sm truncate">{media.name}</h3>
            <p className="text-xs text-muted-foreground">
              {media.file_type} • {format(new Date(media.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
