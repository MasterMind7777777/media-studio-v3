
import { useMemo } from 'react';
import { Template } from '@/types';

interface VariablesByType {
  textVariables: Array<{ key: string, variableName: string, value: string }>;
  mediaVariables: Array<{ key: string, variableName: string, value: string }>;
  colorVariables: Array<{ key: string, variableName: string, value: string }>;
  hasVariables: boolean;
}

export function useTemplateVariables(template: Template | null): VariablesByType {
  return useMemo(() => {
    const result = {
      textVariables: [] as Array<{ key: string, variableName: string, value: string }>,
      mediaVariables: [] as Array<{ key: string, variableName: string, value: string }>,
      colorVariables: [] as Array<{ key: string, variableName: string, value: string }>,
      hasVariables: false
    };

    if (!template?.variables) {
      return result;
    }
    
    // Process each variable
    Object.entries(template.variables).forEach(([key, value]) => {
      // Skip empty or null values
      if (value === undefined || value === null) return;
      
      // Extract the variable name from the key (e.g., "title.text" -> "title")
      const parts = key.split('.');
      const variableName = parts[0];
      const variableType = parts.length > 1 ? parts[1] : '';
      
      // Categorize by type
      if (variableType === 'text') {
        result.textVariables.push({
          key,
          variableName: variableName.replace(/_/g, ' '),
          value: String(value)
        });
      } else if (variableType === 'source') {
        result.mediaVariables.push({
          key,
          variableName: variableName.replace(/_/g, ' '),
          value: String(value)
        });
      } else if (variableType === 'fill') {
        result.colorVariables.push({
          key,
          variableName: variableName.replace(/_/g, ' '),
          value: String(value)
        });
      }
    });
    
    result.hasVariables = 
      result.textVariables.length > 0 || 
      result.mediaVariables.length > 0 || 
      result.colorVariables.length > 0;
    
    return result;
  }, [template?.variables]);
}
