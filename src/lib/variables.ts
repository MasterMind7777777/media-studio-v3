
/**
 * Normalizes variable keys to ensure a consistent format
 * Handles cases like "Element.text.text" -> "Element.text"
 * @param variables Object containing variable keys and values
 * @returns Normalized variables object
 */
export function normalizeKeys(variables: Record<string, any>): Record<string, any> {
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
      // Use the normalized key format
      const normalKey = `${elementName}.text`;
      
      // Find first key with a value
      const valueKey = textKeys.find(k => variables[k] !== undefined) || textKeys[0];
      result[normalKey] = variables[valueKey];
    }
    
    // Process source properties
    if (sourceKeys.length > 0) {
      // Use the normalized key format
      const normalKey = `${elementName}.source`;
      
      // Find first key with a value
      const valueKey = sourceKeys.find(k => variables[k] !== undefined) || sourceKeys[0];
      result[normalKey] = variables[valueKey];
    }
    
    // Process fill properties
    if (fillKeys.length > 0) {
      // Use the normalized key format
      const normalKey = `${elementName}.fill`;
      
      // Find first key with a value
      const valueKey = fillKeys.find(k => variables[k] !== undefined) || fillKeys[0];
      result[normalKey] = variables[valueKey];
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

/**
 * Normalizes a single variable key
 * @param key The variable key to normalize
 * @returns Normalized key
 */
export function normalizeKey(key: string): string {
  const parts = key.split('.');
  if (parts.length <= 1) return key;
  
  const elementName = parts[0];
  let propertyType = parts[1];
  
  // Match property type
  if (propertyType === 'text' || propertyType === 'source' || propertyType === 'fill') {
    return `${elementName}.${propertyType}`;
  }
  
  return key;
}
