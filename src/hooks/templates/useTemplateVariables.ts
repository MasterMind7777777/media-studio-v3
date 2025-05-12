
import { useMemo } from "react";
import { Template } from "@/types";

export function useTemplateVariables(template: Template | null) {
  // Helper functions to extract variables by type from the flattened structure
  const textVariables = useMemo(() => {
    if (!template?.variables) return [];
    
    return Object.entries(template.variables)
      .filter(([key, value]) => key.includes('.text'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'text',
        value
      }));
  }, [template?.variables]);
  
  const mediaVariables = useMemo(() => {
    if (!template?.variables) return [];
    
    return Object.entries(template.variables)
      .filter(([key, value]) => key.includes('.source'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'source',
        value
      }));
  }, [template?.variables]);
  
  const colorVariables = useMemo(() => {
    if (!template?.variables) return [];
    
    return Object.entries(template.variables)
      .filter(([key, value]) => key.includes('.fill'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'fill',
        value
      }));
  }, [template?.variables]);

  return {
    textVariables,
    mediaVariables,
    colorVariables
  };
}
