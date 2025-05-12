
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

    // Create a map to track elements and prevent duplicates
    const processedElements = new Map();
    
    // Process each variable
    Object.entries(template.variables).forEach(([key, value]) => {
      // Skip empty or null values
      if (value === undefined || value === null) return;
      
      // Extract the variable name from the key (e.g., "title.text" -> "title")
      const parts = key.split('.');
      const variableName = parts[0]; // Base element name
      const propertyType = parts.length > 1 ? parts[1] : '';
      
      // Skip if it's a duplicate property type for the same element
      const elementPropertyKey = `${variableName}-${propertyType}`;
      if (processedElements.has(elementPropertyKey)) {
        console.log(`Skipping duplicate: ${key}`);
        return;
      }
      
      // Skip nested source properties
      if (key.endsWith('.source.source') || key.includes('.source.') && !key.endsWith('.source')) {
        console.log(`Skipping nested source property: ${key}`);
        return;
      }
      
      // Categorize variables by type
      if (propertyType === 'text') {
        processedElements.set(elementPropertyKey, true);
        result.textVariables.push({
          key,
          variableName,
          value: String(value),
          property: 'text'
        });
      } else if (propertyType === 'source') {
        processedElements.set(elementPropertyKey, true);
        result.mediaVariables.push({
          key,
          variableName,
          value: String(value),
          property: 'source'
        });
      } else if (propertyType === 'fill') {
        processedElements.set(elementPropertyKey, true);
        result.colorVariables.push({
          key,
          variableName,
          value: String(value),
          property: 'fill'
        });
      }
    });
    
    // Sort variables alphabetically by variableName for consistent display
    result.textVariables.sort((a, b) => a.variableName.localeCompare(b.variableName));
    result.mediaVariables.sort((a, b) => a.variableName.localeCompare(b.variableName));
    result.colorVariables.sort((a, b) => a.variableName.localeCompare(b.variableName));
    
    result.hasVariables = 
      result.textVariables.length > 0 || 
      result.mediaVariables.length > 0 || 
      result.colorVariables.length > 0;
    
    return result;
  }, [template?.variables]);
}

export type { TemplateVariableSection };
