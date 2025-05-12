
import { useMemo } from 'react';
import { Template } from '@/types';

interface TemplateVariableSection {
  key: string;
  variableName: string;
  value: string;
  property: string;
}

interface VariablesByType {
  textVariables: Array<TemplateVariableSection>;
  mediaVariables: Array<TemplateVariableSection>;
  colorVariables: Array<TemplateVariableSection>;
  hasVariables: boolean;
}

export function useTemplateVariables(template: Template | null): VariablesByType {
  return useMemo(() => {
    const result = {
      textVariables: [] as Array<TemplateVariableSection>,
      mediaVariables: [] as Array<TemplateVariableSection>,
      colorVariables: [] as Array<TemplateVariableSection>,
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
          value: String(value),
          property: 'text'
        });
      } else if (variableType === 'source') {
        result.mediaVariables.push({
          key,
          variableName: variableName.replace(/_/g, ' '),
          value: String(value),
          property: 'source'
        });
      } else if (variableType === 'fill') {
        result.colorVariables.push({
          key,
          variableName: variableName.replace(/_/g, ' '),
          value: String(value),
          property: 'fill'
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

export type { TemplateVariableSection };
