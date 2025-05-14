
// Standardize to use sonner toast system
import { toast } from "sonner";

// Re-export toast from sonner
export { toast };

// Compatibility layer for existing code that uses useToast hook
export function useToast() {
  return {
    toast: {
      // Map common toast methods to sonner equivalents
      success: (content: string) => toast.success(content),
      error: (content: string) => toast.error(content),
      info: (content: string) => toast(content),
      warning: (content: string) => toast.warning(content),
      // For legacy code using object style
      // This allows { title, description } style calls to work with sonner
      // which expects a string message and optional description
      (...args: any[]) {
        const [content] = args;
        if (typeof content === 'object' && content !== null) {
          const { title, description } = content;
          if (description) {
            return toast(title, { description });
          }
          return toast(title);
        }
        return toast(content);
      }
    }
  };
}
