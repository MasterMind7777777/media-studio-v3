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

/**
 * Extracts and categorizes template variables from a template
 * @param template The template containing variables
 * @returns Organized variables by type (text, media, color)
 */
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
    
    // First, normalize the variables by removing duplicate nested properties
    const normalizedVariables = normalizeTemplateVariables(template.variables);
    
    // Process each variable
    Object.entries(normalizedVariables).forEach(([key, value]) => {
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
      
      // Skip other nested properties like text.text, fill.fill, etc.
      if (
        (key.endsWith('.text.text') && processedElements.has(`${variableName}-text`)) ||
        (key.endsWith('.fill.fill') && processedElements.has(`${variableName}-fill`))
      ) {
        console.log(`Skipping nested property: ${key}`);
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

/**
 * Normalizes template variables by removing duplicate nested properties
 * @param variables The template variables
 * @returns Normalized variables
 */
function normalizeTemplateVariables(variables: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  const propertyMap = new Map<string, string[]>(); // Maps base properties to their nested versions
  
  // First pass: categorize all keys by their base property
  Object.keys(variables).forEach(key => {
    const parts = key.split('.');
    const baseProp = `${parts[0]}.${parts[1] || ''}`;
    
    if (!propertyMap.has(baseProp)) {
      propertyMap.set(baseProp, []);
    }
    
    propertyMap.get(baseProp)?.push(key);
  });
  
  // Second pass: for each base property, keep only the simplest version
  propertyMap.forEach((keys, baseProp) => {
    if (keys.length === 1) {
      // Only one version exists, keep it
      const key = keys[0];
      result[key] = variables[key];
      return;
    }
    
    // Multiple versions exist, find the simplest one
    keys.sort((a, b) => a.split('.').length - b.split('.').length);
    
    // Always keep the shortest form (fewest dots)
    const simplestKey = keys[0]; 
    result[simplestKey] = variables[simplestKey];
    
    // Log discarded duplicates
    keys.slice(1).forEach(key => {
      console.log(`Normalizing: discarding ${key} in favor of ${simplestKey}`);
    });
  });
  
  return result;
}

export type { TemplateVariableSection };
