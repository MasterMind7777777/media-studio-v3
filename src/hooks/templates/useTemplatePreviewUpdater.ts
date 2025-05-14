import { useState, useRef } from "react";
import { useDebouncedCallback } from "../utils/useDebouncedCallback";
import type { MediaAsset } from "@/types";

export interface UseTemplatePreviewUpdaterOptions {
  initialVariables: Record<string, any>;
  onPreviewUpdate: (vars: Record<string, any>) => void;
  debounceMs?: number;
}

const TEXT = "text";
const FILL = "fill";
const SOURCE = "source";

function buildKey(id: string, sub: string) {
  return `${id}.${sub}`; // e.g. "Text-1.text"
}

export function useTemplatePreviewUpdater({
  initialVariables = {},
  onPreviewUpdate,
  debounceMs = 150,
}: UseTemplatePreviewUpdaterOptions) {
  const [mods, setMods] = useState<Record<string, any>>(initialVariables);
  const [selected, setSelected] = useState<Record<string, MediaAsset>>({});
  const [isUpdating, setUpd] = useState(false);

  const latest = useRef(mods);
  latest.current = mods;

  const push = useDebouncedCallback((v) => {
    setUpd(false);
    onPreviewUpdate(v);
  }, debounceMs);

  /* helper ---------------------------------------------------------------- */
  function patch(id: string, sub: string, value: string) {
    // ▸ avoid "Text-1.text.text"
    const key = id.includes(".") ? id : buildKey(id, sub);
    return { ...latest.current, [key]: String(value ?? "") };
  }

  /* handlers -------------------------------------------------------------- */
  const handleTextChange = (id: string, value: string) => {
    setUpd(true);
    const next = patch(id, TEXT, value);
    setMods(next);
    push(next);
  };

  const handleColorChange = (id: string, value: string) => {
    setUpd(true);
    const next = patch(id, FILL, value);
    setMods(next);
    push(next);
  };

  const handleMediaSelected = (id: string, media: MediaAsset) => {
    setUpd(true);
    setSelected((p) => ({ ...p, [id]: media }));

    const url = media.source_url || media.file_url || "";
    const next = patch(id, SOURCE, url);
    setMods(next);
    onPreviewUpdate(next); // immediate for media (no debounce)
  };

  return {
    variables: mods,
    selectedMedia: selected,
    isUpdating,
    handleTextChange,
    handleColorChange,
    handleMediaSelected,
    setVariables: setMods,
  };
}
