import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaAssets, useUploadMedia } from "@/hooks/api/useMediaAssets";
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
  const isLoading = propIsLoading !== undefined ? propIsLoading : isFetching;
  
  const uploadMediaMutation = useUploadMedia();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectMedia = (media: MediaAsset) => {
    if (onMediaSelect) {
      onMediaSelect(media);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload to storage and create media asset in one step
      const newMedia = await uploadMediaMutation.mutateAsync({ file, name: file.name, contentPackId });
      // Select the new media
      if (onMediaSelect) onMediaSelect(newMedia);
    } catch (err) {
      // Optionally handle error (e.g., show toast)
    }
    setUploading(false);
  };
  
  if (isLoading) {
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
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button onClick={handleUploadClick} disabled={uploading} size="sm">
          Upload New Media
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*,video/*"
        />
        {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary ml-2" />}
      </div>
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
    </>
  );
}
