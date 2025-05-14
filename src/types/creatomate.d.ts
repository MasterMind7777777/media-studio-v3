
import { Preview as OriginalPreview } from '@creatomate/preview';

// Extend the Preview type from @creatomate/preview
declare module '@creatomate/preview' {
  interface Preview extends OriginalPreview {
    addEventListener(event: string, callback: Function): void;
    isPlaying?: () => boolean;
    play(): void;
    pause(): void;
    setModifications(modifications: Record<string, any>): void;
    dispose(): void;
  }
}
