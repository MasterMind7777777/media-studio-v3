
import { useMemo } from "react";
import { Template } from "@/types";
import { formatVariablesForPlayer } from "@/integrations/creatomate/config";

export function useTemplateVariables(template: Template | null) {
  // Helper function to validate if we have a valid template with variables
  const hasVariables = useMemo(() => {
    return !!template?.variables && Object.keys(template.variables).length > 0;
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

  // Format variables for Creatomate Player - ensuring correct format
  const formattedVariables = useMemo(() => {
    if (!hasVariables) return {};
    
    try {
      // Use our formatter helper to ensure variables are in the right format
      return formatVariablesForPlayer(template!.variables);
    } catch (error) {
      console.error('Error formatting variables:', error);
      return {};
    }
  }, [hasVariables, template?.variables]);

  // Debug function to check variable structure
  const debugVariables = useMemo(() => {
    return {
      hasVariables,
      variableCount: hasVariables ? Object.keys(template!.variables).length : 0,
      textCount: textVariables.length,
      mediaCount: mediaVariables.length,
      colorCount: colorVariables.length,
      formattedKeys: hasVariables ? Object.keys(formattedVariables) : []
    };
  }, [hasVariables, template?.variables, textVariables.length, mediaVariables.length, colorVariables.length, formattedVariables]);

  return {
    textVariables,
    mediaVariables,
    colorVariables,
    formattedVariables,
    hasVariables,
    debugVariables
  };
}
