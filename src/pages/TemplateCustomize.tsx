import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* components */
import { TemplateHeader } from "@/components/Templates/TemplateHeader";
import { TemplateVariablesEditor } from "@/components/Templates/TemplateVariablesEditor";
import { MediaSelectionDialog } from "@/components/Media/MediaSelectionDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

/* hooks */
import {
  useCreatomatePreview,
  useTemplatePreviewUpdater,
  useTemplateVariables,
} from "@/hooks/templates";
import { useTemplate } from "@/hooks/api/templates/useTemplate";
import { useCreateRenderJob } from "@/hooks/api/useCreateRenderJob";
import { useToast } from "@/hooks/use-toast";

/* types */
import type { MediaAsset, Template } from "@/types";

/* utils */
import { isCreatomateDisabled } from "@/components/CreatomateLoader";

/* -------------------------------------------------------------------------- */
/* Error boundary                                                             */
/* -------------------------------------------------------------------------- */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(e: unknown, info: unknown) {
    console.error("Component error:", e, info);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */
export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { mutateAsync: createRenderJob } = useCreateRenderJob();

  /* template fetch ----------------------------------------------------- */
  const {
    data: template,
    isLoading: templateLoading,
    error: templateError,
  } = useTemplate(id);

  /* preview ------------------------------------------------------------ */
  /* TemplateCustomize.tsx ------------------------------------ */
  const handlePreviewError = useCallback(
    (e: Error) =>
      toast({
        title: "Preview error",
        description: e.message,
        variant: "destructive",
      }),
    [toast], // ← memoised once, never changes afterward
  );

  const {
    currentVars,
    forceUpdateVariables,
    isReady: previewReady,
    aspectRatio: previewAspectRatio,
  } = useCreatomatePreview({
    containerId: "creatomate-preview-container",
    templateId: template?.creatomate_template_id,
    variables: template?.variables ?? {}, // still initial vars only
    onError: handlePreviewError, // ← stable now
  });

  /* live variable updater --------------------------------------------- */
  const {
    variables: patchVars, // keys changed this session
    selectedMedia,
    isUpdating,
    handleTextChange,
    handleColorChange,
    handleMediaSelected,
  } = useTemplatePreviewUpdater({
    initialVariables: template?.variables ?? {},
    onPreviewUpdate: forceUpdateVariables,
  });

  /* 🔸 merge original + edits for UI ---------------------------------- */
  const mergedVars = useMemo(
    () => ({ ...(template?.variables ?? {}), ...patchVars }),
    [template?.variables, patchVars],
  );

  /* Give mapper a Template-shaped object ------------------------------ */
  const templateForVars: Template | null = useMemo(() => {
    if (!template) return null;
    return { ...template, variables: mergedVars };
  }, [template, mergedVars]);

  const { textVariables, mediaVariables, colorVariables } =
    useTemplateVariables(templateForVars);

  /* render & other logic remain unchanged ----------------------------- */

  const [isRendering, setIsRendering] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [currentMediaKey, setCurrentMediaKey] = useState<string>("");

  useEffect(() => {
    if (!templateError) return;
    toast({
      id: "template-error",
      title: "Error loading template",
      description: templateError.message || "Failed to load template data",
      variant: "destructive",
    });
  }, [templateError, toast]);

  const handleMediaSelect = useCallback((key: string) => {
    setCurrentMediaKey(key);
    setIsMediaDialogOpen(true);
  }, []);

  const handleMediaDialogSelect = useCallback(
    (asset: MediaAsset) => {
      if (!currentMediaKey) return;
      handleMediaSelected(currentMediaKey, asset);
      setIsMediaDialogOpen(false);
    },
    [currentMediaKey, handleMediaSelected],
  );

  const handleRender = useCallback(async () => {
    if (!template || !id) {
      toast({
        id: "render-missing-data",
        title: "Cannot start render",
        description: "Template information is missing",
      });
      return;
    }
    setIsRendering(true);
    try {
      const result = await createRenderJob({
        templateId: id,
        variables: currentVars,
        platforms: template.platforms ?? [],
      });
      toast({
        id: "render-success",
        title: "Render started successfully!",
        description: "Your video is now being rendered",
      });
      navigate(`/projects?job=${result.id}`);
    } catch (err: any) {
      toast({
        id: "render-failure",
        title: "Failed to start render",
        description: err?.message ?? "An unknown error occurred",
      });
    } finally {
      setIsRendering(false);
    }
  }, [template, id, currentVars, createRenderJob, navigate, toast]);

  const previewImageUrl = template?.preview_image_url || "/placeholder.svg";

  return (
    <div className="container max-w-7xl py-8">
      {isCreatomateDisabled && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="mr-2 h-4 w-4" />
          <AlertDescription>
            Live preview is temporarily disabled for development.
          </AlertDescription>
        </Alert>
      )}

      {template && <TemplateHeader templateName={template.name} />}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 h-[70vh]">
        {/* preview ------------------------------------------------------- */}
        <ErrorBoundary
          fallback={
            <div className="rounded-lg bg-red-50 p-6 text-red-800">
              Preview failed.
            </div>
          }
        >
          <Card className="overflow-hidden h-full flex flex-col">
            <div className="border-b p-4">
              <h3 className="font-medium">Preview</h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {templateLoading ? (
                <div className="flex items-center justify-center rounded-md bg-muted w-full h-full">
                  <p className="animate-pulse text-muted-foreground">
                    Loading…
                  </p>
                </div>
              ) : (
                <div
                  id="creatomate-preview-container"
                  className="w-full h-full"
                  style={{ minHeight: 0, minWidth: 0 }}
                />
              )}
            </div>
          </Card>
        </ErrorBoundary>

        {/* editor -------------------------------------------------------- */}
        <ErrorBoundary
          fallback={<p className="text-red-600">Editor failed.</p>}
        >
          {templateForVars && (
            <TemplateVariablesEditor
              textVariables={textVariables}
              mediaVariables={mediaVariables}
              colorVariables={colorVariables}
              platforms={templateForVars.platforms ?? []}
              selectedMedia={selectedMedia}
              onTextChange={handleTextChange}
              onColorChange={handleColorChange}
              onMediaSelect={handleMediaSelect}
              isRendering={isRendering}
              isUpdating={isUpdating}
              onRender={handleRender}
            />
          )}
        </ErrorBoundary>
      </div>

      <MediaSelectionDialog
        open={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onSelect={handleMediaDialogSelect}
      />
    </div>
  );
}
