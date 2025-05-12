
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentPack } from "@/types";

/**
 * Hook to fetch all content packs
 */
export const useContentPacks = () => {
  return useQuery({
    queryKey: ["contentPacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_packs")
        .select("*")
        .eq("is_active", true);
        
      if (error) {
        throw new Error(`Error fetching content packs: ${error.message}`);
      }
      
      return data as ContentPack[];
    }
  });
};

/**
 * Hook to fetch a single content pack by ID
 */
export const useContentPack = (id: string | undefined) => {
  return useQuery({
    queryKey: ["contentPacks", id],
    queryFn: async () => {
      if (!id) throw new Error("Content Pack ID is required");
      
      const { data, error } = await supabase
        .from("content_packs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
        
      if (error) {
        throw new Error(`Error fetching content pack: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Content pack not found with ID: ${id}`);
      }
      
      return data as ContentPack;
    },
    enabled: !!id
  });
};

/**
 * Hook to create a new content pack
 */
export const useCreateContentPack = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contentPack: Omit<ContentPack, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("content_packs")
        .insert([contentPack])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating content pack: ${error.message}`);
      }
      
      return data as ContentPack;
    },
    onSuccess: () => {
      // Invalidate content packs query to refetch data
      queryClient.invalidateQueries({ queryKey: ["contentPacks"] });
    }
  });
};

/**
 * Hook to update a content pack
 */
export const useUpdateContentPack = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...contentPack }: Partial<ContentPack> & { id: string }) => {
      const { data, error } = await supabase
        .from("content_packs")
        .update(contentPack)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating content pack: ${error.message}`);
      }
      
      return data as ContentPack;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific content pack query and list
      queryClient.invalidateQueries({ queryKey: ["contentPacks", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["contentPacks"] });
    }
  });
};

/**
 * Hook to delete a content pack
 */
export const useDeleteContentPack = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_packs")
        .delete()
        .eq("id", id);
        
      if (error) {
        throw new Error(`Error deleting content pack: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: (id) => {
      // Remove content pack from cache and invalidate list
      queryClient.removeQueries({ queryKey: ["contentPacks", id] });
      queryClient.invalidateQueries({ queryKey: ["contentPacks"] });
    }
  });
};
