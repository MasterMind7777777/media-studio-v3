
// Standardize to use sonner toast system
import { toast as sonnerToast } from "sonner";

// Re-export toast from sonner
export { sonnerToast as toast };

// Compatibility layer for existing code that uses useToast hook
export function useToast() {
  return {
    toast: {
      // Map common toast methods to sonner equivalents
      success: (content: string | { title: string; description?: string }) => {
        if (typeof content === 'object') {
          return sonnerToast.success(content.title, { description: content.description });
        }
        return sonnerToast.success(content);
      },
      error: (content: string | { title: string; description?: string }) => {
        if (typeof content === 'object') {
          return sonnerToast.error(content.title, { description: content.description });
        }
        return sonnerToast.error(content);
      },
      info: (content: string | { title: string; description?: string }) => {
        if (typeof content === 'object') {
          return sonnerToast(content.title, { description: content.description });
        }
        return sonnerToast(content);
      },
      warning: (content: string | { title: string; description?: string }) => {
        if (typeof content === 'object') {
          return sonnerToast.warning(content.title, { description: content.description });
        }
        return sonnerToast.warning(content);
      },
      // For legacy code using object style
      (...args: any[]): any {
        const [content] = args;
        if (typeof content === 'object' && content !== null) {
          const { title, description } = content;
          if (description) {
            return sonnerToast(title, { description });
          }
          return sonnerToast(title);
        }
        return sonnerToast(content);
      }
    }
  };
}
