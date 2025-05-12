import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaAsset } from "@/types";
import { Json } from "@/integrations/supabase/types";
import { QueryOptions, QueryKey } from '@tanstack/react-query';

/**
 * Helper function to generate a unique ID (replacing uuid dependency)
 */
function generateUniqueId() {
  // Create a timestamp-based prefix
  const timestamp = new Date().getTime().toString(36);
  
  // Add random component
  const randomPart = Math.random().toString(36).substring(2, 10);
  
  // Combine for a reasonably unique ID
  return `${timestamp}-${randomPart}`;
}

type MediaAssetsOptions = {
  enabled?: boolean;
}

/**
 * Hook to fetch all media assets
 */
export const useMediaAssets = (contentPackId?: string, options?: MediaAssetsOptions) => {
  return useQuery({
    queryKey: ["mediaAssets", { contentPackId }],
    queryFn: async () => {
      let query = supabase
        .from("media_assets")
        .select("*");
        
      if (contentPackId) {
        query = query.eq("content_pack_id", contentPackId);
      }
      
      const { data, error } = await query;
        
      if (error) {
        throw new Error(`Error fetching media assets: ${error.message}`);
      }
      
      return data as MediaAsset[];
    },
    enabled: options?.enabled
  });
};

/**
 * Hook to fetch a single media asset by ID
 */
export const useMediaAsset = (id: string | undefined) => {
  return useQuery({
    queryKey: ["mediaAssets", id],
    queryFn: async () => {
      if (!id) throw new Error("Media Asset ID is required");
      
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();
        
      if (error) {
        throw new Error(`Error fetching media asset: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Media asset not found with ID: ${id}`);
      }
      
      return data as MediaAsset;
    },
    enabled: !!id
  });
};

/**
 * Hook to create a new media asset
 */
export const useCreateMediaAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mediaAsset: Omit<MediaAsset, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("media_assets")
        .insert([mediaAsset])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating media asset: ${error.message}`);
      }
      
      return data as MediaAsset;
    },
    onSuccess: (data) => {
      // Invalidate media assets query and update any content pack queries if relevant
      queryClient.invalidateQueries({ queryKey: ["mediaAssets"] });
      if (data.content_pack_id) {
        queryClient.invalidateQueries({ queryKey: ["contentPacks", data.content_pack_id] });
      }
    }
  });
};

/**
 * Hook to update a media asset
 */
export const useUpdateMediaAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...mediaAsset }: Partial<MediaAsset> & { id: string }) => {
      const { data, error } = await supabase
        .from("media_assets")
        .update(mediaAsset)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating media asset: ${error.message}`);
      }
      
      return data as MediaAsset;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific media asset query and list
      queryClient.invalidateQueries({ queryKey: ["mediaAssets", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["mediaAssets"] });
    }
  });
};

/**
 * Hook to delete a media asset
 */
export const useDeleteMediaAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", id);
        
      if (error) {
        throw new Error(`Error deleting media asset: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: (id) => {
      // Remove media asset from cache and invalidate list
      queryClient.removeQueries({ queryKey: ["mediaAssets", id] });
      queryClient.invalidateQueries({ queryKey: ["mediaAssets"] });
    }
  });
};

/**
 * Hook for uploading media to Supabase Storage
 */
export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      name, 
      contentPackId 
    }: { 
      file: File; 
      name: string; 
      contentPackId?: string 
    }) => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Determine file type
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      
      // Create a unique file name to prevent overwriting
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${generateUniqueId()}.${fileExtension}`;
      const filePath = `${user.id}/${uniqueFileName}`;
      
      try {
        // Upload file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false
          });
        
        if (storageError) {
          throw new Error(`Error uploading file: ${storageError.message}`);
        }
        
        // Generate URLs for the uploaded file
        const { data: { publicUrl: fileUrl } } = supabase
          .storage
          .from('media')
          .getPublicUrl(filePath);
          
        // For images, use the same URL for thumbnail
        // In a production app, you might want to generate actual thumbnails
        const thumbnailUrl = fileType === 'image' 
          ? fileUrl 
          : fileUrl; // For video, you'd generate a thumbnail
        
        // Create a record in the media_assets table
        const { data, error } = await supabase
          .from("media_assets")
          .insert([{
            name: name,
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            file_type: fileType,
            user_id: user.id,
            content_pack_id: contentPackId || null,
            metadata: {
              size: file.size,
              type: file.type,
              width: fileType === 'image' ? 1920 : 1280, // Placeholder values
              height: fileType === 'image' ? 1080 : 720   // Placeholder values
            } as unknown as Json
          }])
          .select()
          .single();
          
        if (error) {
          throw new Error(`Error saving media asset: ${error.message}`);
        }
        
        return data as MediaAsset;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate media assets query
      queryClient.invalidateQueries({ queryKey: ["mediaAssets"] });
      if (data.content_pack_id) {
        queryClient.invalidateQueries({ queryKey: ["contentPacks", data.content_pack_id] });
      }
    }
  });
};
