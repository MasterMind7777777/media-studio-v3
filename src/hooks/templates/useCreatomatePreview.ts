/* useCreatomatePreview.ts -------------------------------------------------- */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  getPreviewInstance,
  disposePreviewInstance,
  isCreatomatePreviewDisabled,
  getCreatomateToken,
} from "@/lib/loadCreatomatePreview";
import type { Preview } from "@creatomate/preview";

export interface PreviewState {
  isReady: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  error: Error | null;
  togglePlay: () => void;
  currentVars: Record<string, any>;
  forceUpdateVariables: (vars: Record<string, any>) => void;
  aspectRatio?: number;
}

interface UseCreatomatePreviewOptions {
  containerId: string;
  templateId: string | undefined;
  variables?: Record<string, any>;
  onError?: (err: Error) => void;
}

export function useCreatomatePreview({
  containerId,
  templateId,
  variables = {},
  onError,
}: UseCreatomatePreviewOptions): PreviewState {
  /* ---------------- local state --------------------------------------- */
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentVars, setCurrentVars] =
    useState<Record<string, any>>(variables);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>();

  /* ---------------- refs --------------------------------------------- */
  const previewRef = useRef<Preview | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const readyRef = useRef(false);
  const pendingPatch = useRef<Record<string, any> | null>(null);

  /* ---------------- helpers ------------------------------------------ */
  const log = (...msg: any[]) => console.log("[Creatomate-hook]", ...msg);

  /* ---------------- API callbacks ------------------------------------ */
  const togglePlay = useCallback(() => {
    const p = previewRef.current;
    if (!p) return;
    const playing = typeof p.isPlaying === "function" ? p.isPlaying() : false;
    playing ? p.pause() : p.play();
    setIsPlaying(!playing);
  }, []);

  const forceUpdateVariables = useCallback(
    (vars: Record<string, any>) => {
      log("forceUpdateVariables()", vars, "ready?", readyRef.current);

      if (!readyRef.current) {
        pendingPatch.current = { ...(pendingPatch.current ?? {}), ...vars };
        log("🔸 queued patch (preview not ready)", pendingPatch.current);
        setCurrentVars((prev) => ({ ...prev, ...vars }));
        return;
      }

      try {
        previewRef.current?.setModifications(vars);
        log("🔸 flushed patch", vars);
        setCurrentVars((prev) => ({ ...prev, ...vars }));
      } catch (err) {
        console.error("Error updating preview variables:", err);
        onError?.(err as Error);
      }
    },
    [onError],
  );

  /* ---------------- effect ------------------------------------------- */
  const variablesHash = useMemo(() => JSON.stringify(variables), [variables]);

  useEffect(() => {
    log("effect fire →", { containerId, templateId, variables });

    if (isCreatomatePreviewDisabled) {
      setIsLoading(false);
      log("preview disabled by env var");
      return;
    }
    if (!templateId) {
      setIsLoading(false);
      log("no templateId yet – waiting");
      return;
    }

    containerRef.current = document.getElementById(containerId);
    if (!containerRef.current) {
      log("DOM container not found yet – will retry");
      return; // effect runs again next render
    }

    const token = getCreatomateToken();
    if (!token) {
      const err = new Error("Creatomate public token missing in .env");
      setError(err);
      setIsLoading(false);
      onError?.(err);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);

        previewRef.current = await getPreviewInstance(
          {
            container: containerRef.current!,
            mode: "player",
            token,
            templateId,
            modifications: variables,
          },
          true, // forceNew
        );

        log("✓ getPreviewInstance()", { templateId, variables });

        const preview = previewRef.current!;

        const onReady = () => {
          if (cancelled) return;
          readyRef.current = true;
          log("→ ready event");
          setIsReady(true);
          setIsLoading(false);
          setIsPlaying(
            typeof preview.isPlaying === "function"
              ? preview.isPlaying()
              : true,
          );

          if (pendingPatch.current) {
            try {
              preview.setModifications(pendingPatch.current);
              log("🔸 flushed queued patch after ready", pendingPatch.current);
              setCurrentVars((prev) => ({ ...prev, ...pendingPatch.current! }));
            } catch (err) {
              console.error("Error flushing queued vars:", err);
              onError?.(err as Error);
            } finally {
              pendingPatch.current = null;
            }
          }
        };

        const onState = (evt: any) => {
          if (cancelled) return;
          const detail = (evt as CustomEvent)?.detail || evt;

          const playing = detail?.isPlaying;
          log("statechange", { playing, width: detail?.width, height: detail?.height });
          if (typeof playing === "boolean") setIsPlaying(playing);

          if (detail?.width && detail?.height && detail.height !== 0) {
            const newRatio = detail.width / detail.height;
            setAspectRatio((prevRatio) => {
              if (prevRatio !== newRatio) {
                log("→ aspect ratio updated", newRatio);
                return newRatio;
              }
              return prevRatio;
            });
          }
        };

        const onErr = (err: Error) => {
          if (cancelled) return;
          console.error("Preview error event:", err);
          setError(err);
          setIsLoading(false);
          onError?.(err);
        };

        if (typeof (preview as any).addEventListener === "function") {
          preview.addEventListener("ready", onReady);
          preview.addEventListener("statechange", onState);
          preview.addEventListener("error", onErr);
        } else if (typeof (preview as any).on === "function") {
          // Creatomate SDK < 1.6
          (preview as any).on("ready", onReady);
          (preview as any).on("statechange", onState);
          (preview as any).on("error", onErr);
        } else {
          /* ──────────────────────────────────────────────────────────────
             The instance exposes no event API (very old SDK or stubs).
             Call onReady immediately so the queued patch still flushes.
          ────────────────────────────────────────────────────────────── */
          console.warn(
            "[Creatomate-hook] preview instance exposes no event API; assuming ready",
          );
          onReady();
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to initialise Creatomate preview:", err);
          setError(err as Error);
          setIsLoading(false);
          onError?.(err as Error);
        }
      }
    })();

    /* cleanup ---------------------------------------------------------- */
    return () => {
      cancelled = true;
      readyRef.current = false;
      pendingPatch.current = null;
      if (previewRef.current) {
        disposePreviewInstance();
        previewRef.current = null;
        log("disposePreviewInstance()");
      }
    };
  }, [containerId, templateId, variablesHash, onError]);

  /* ---------------- return API --------------------------------------- */
  return {
    isReady,
    isLoading,
    isPlaying,
    error,
    togglePlay,
    currentVars,
    forceUpdateVariables,
    aspectRatio,
  };
}
