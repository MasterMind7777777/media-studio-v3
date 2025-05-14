
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
    console.log('Normalized variables:', normalizedVariables);
    
    // Process each variable
    Object.entries(normalizedVariables).forEach(([key, value]) => {
      // Skip empty or null values
      if (value === undefined || value === null) return;
      
      // Extract the variable name and property type from the key
      const { baseName, propertyType } = extractVariableNameAndProperty(key);
      
      // Skip if it's a duplicate property type for the same element
      const elementPropertyKey = `${baseName}-${propertyType}`;
      if (processedElements.has(elementPropertyKey)) {
        console.log(`Skipping duplicate: ${key}`);
        return;
      }
      
      // Categorize variables by type
      if (propertyType === 'text') {
        processedElements.set(elementPropertyKey, true);
        result.textVariables.push({
          key,
          variableName: baseName,
          value: String(value),
          property: 'text'
        });
      } else if (propertyType === 'source') {
        processedElements.set(elementPropertyKey, true);
        result.mediaVariables.push({
          key,
          variableName: baseName,
          value: String(value),
          property: 'source'
        });
      } else if (propertyType === 'fill') {
        processedElements.set(elementPropertyKey, true);
        result.colorVariables.push({
          key,
          variableName: baseName,
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
 * Extracts the base name and property type from a variable key
 * @param key The variable key (e.g., "Heading.text.text")
 * @returns Object with baseName and propertyType
 */
function extractVariableNameAndProperty(key: string): { baseName: string, propertyType: string } {
  const parts = key.split('.');
  const baseName = parts[0]; // Base element name
  
  // Find the property type (text, source, fill)
  let propertyType = '';
  if (parts.includes('text')) propertyType = 'text';
  else if (parts.includes('source')) propertyType = 'source';
  else if (parts.includes('fill')) propertyType = 'fill';
  
  return { baseName, propertyType };
}

/**
 * Normalizes template variables by removing duplicate nested properties
 * @param variables The template variables
 * @returns Normalized variables
 */
function normalizeTemplateVariables(variables: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  const elementMap = new Map<string, string[]>();
  
  // Group keys by their element name
  Object.keys(variables).forEach(key => {
    const parts = key.split('.');
    const elementName = parts[0];
    
    if (!elementMap.has(elementName)) {
      elementMap.set(elementName, []);
    }
    
    elementMap.get(elementName)?.push(key);
  });
  
  // Process each element group
  elementMap.forEach((keys, elementName) => {
    // Categorize keys by property type
    const textKeys = keys.filter(k => k.includes('.text'));
    const sourceKeys = keys.filter(k => k.includes('.source'));
    const fillKeys = keys.filter(k => k.includes('.fill'));
    
    // Process text properties
    if (textKeys.length > 0) {
      // Find the simplest key (fewest parts)
      const simplestKey = textKeys.sort((a, b) => 
        a.split('.').length - b.split('.').length
      )[0];
      
      // Use the normalized key format
      const normalKey = `${elementName}.text`;
      result[normalKey] = variables[simplestKey];
      
      console.log(`Normalized text key: ${simplestKey} -> ${normalKey}`);
    }
    
    // Process source properties
    if (sourceKeys.length > 0) {
      // Find the simplest key
      const simplestKey = sourceKeys.sort((a, b) => 
        a.split('.').length - b.split('.').length
      )[0];
      
      // Use the normalized key format
      const normalKey = `${elementName}.source`;
      result[normalKey] = variables[simplestKey];
      
      console.log(`Normalized source key: ${simplestKey} -> ${normalKey}`);
    }
    
    // Process fill properties
    if (fillKeys.length > 0) {
      // Find the simplest key
      const simplestKey = fillKeys.sort((a, b) => 
        a.split('.').length - b.split('.').length
      )[0];
      
      // Use the normalized key format
      const normalKey = `${elementName}.fill`;
      result[normalKey] = variables[simplestKey];
      
      console.log(`Normalized fill key: ${simplestKey} -> ${normalKey}`);
    }
    
    // Handle keys that don't match our known property types
    keys.forEach(key => {
      if (!key.includes('.text') && !key.includes('.source') && !key.includes('.fill')) {
        result[key] = variables[key];
      }
    });
  });
  
  return result;
}

export type { TemplateVariableSection };
