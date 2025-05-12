
import { useMemo } from "react";
import { Template } from "@/types";

export function useTemplateVariables(template: Template | null) {
  // Helper function to validate if we have a valid template with variables
  const hasVariables = useMemo(() => {
    return template?.variables && Object.keys(template.variables).length > 0;
  }, [template]);

  // Extract text variables from template
  const textVariables = useMemo(() => {
    if (!hasVariables) return [];
    
    return Object.entries(template!.variables)
      .filter(([key]) => key.includes('.text'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'text',
        value
      }));
  }, [hasVariables, template?.variables]);
  
  // Extract media variables from template
  const mediaVariables = useMemo(() => {
    if (!hasVariables) return [];
    
    return Object.entries(template!.variables)
      .filter(([key]) => key.includes('.source'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'source',
        value
      }));
  }, [hasVariables, template?.variables]);
  
  // Extract color variables from template
  const colorVariables = useMemo(() => {
    if (!hasVariables) return [];
    
    return Object.entries(template!.variables)
      .filter(([key]) => key.includes('.fill'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'fill',
        value
      }));
  }, [hasVariables, template?.variables]);

  // Format variables for Creatomate Player - preserving original structure
  const formattedVariables = useMemo(() => {
    if (!hasVariables) return {};
    
    // Return the original variables structure as Creatomate expects
    return template!.variables;
  }, [hasVariables, template?.variables]);

  return {
    textVariables,
    mediaVariables,
    colorVariables,
    formattedVariables,
    hasVariables
  };
}
