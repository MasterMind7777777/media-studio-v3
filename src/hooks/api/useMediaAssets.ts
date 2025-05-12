
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaAsset } from "@/types";

/**
 * Hook to fetch all media assets
 */
export const useMediaAssets = (contentPackId?: string) => {
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
    }
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
 * Note: This would typically use Supabase Storage which isn't fully implemented here
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
      // In a real implementation, we would upload to Supabase Storage
      // This is a placeholder until storage is set up
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      const mockFileUrl = `https://example.com/${name}`;
      const mockThumbnailUrl = `https://example.com/${name}-thumbnail`;
      
      // Then create a record in the media_assets table
      const { data, error } = await supabase
        .from("media_assets")
        .insert([{
          name,
          file_url: mockFileUrl,
          thumbnail_url: mockThumbnailUrl,
          file_type: fileType,
          content_pack_id: contentPackId || null,
          metadata: {
            size: file.size,
            type: file.type
          }
        }])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error saving media asset: ${error.message}`);
      }
      
      return data as MediaAsset;
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
