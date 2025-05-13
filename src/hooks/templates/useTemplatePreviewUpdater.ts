
import { useState } from "react";
import { useUpdateTemplatePreviewBulk } from "@/hooks/api/templates";
import { toast } from "sonner";

/**
 * Hook to update template preview images in bulk
 * @returns Object with update function and loading state
 */
export function useTemplatePreviewUpdater() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);
  
  const { mutateAsync: updateTemplatePreviews, isPending } = useUpdateTemplatePreviewBulk();
  
  const updatePreviews = async () => {
    setIsRunning(true);
    toast.info("Updating template previews", {
      description: "Scanning all templates for better preview images..."
    });
    
    try {
      const result = await updateTemplatePreviews();
      setResults(result);
      
      toast.success("Template previews updated", {
        description: `Updated ${result.success} of ${result.total} templates.${result.failed > 0 ? ` Failed: ${result.failed}.` : ''}${result.skipped > 0 ? ` Skipped: ${result.skipped}.` : ''}`
      });
    } catch (error) {
      console.error("Error updating template previews:", error);
      toast.error("Failed to update template previews", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  return {
    updatePreviews,
    isUpdating: isRunning || isPending,
    results
  };
}
