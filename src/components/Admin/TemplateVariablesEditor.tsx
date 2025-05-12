
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateVariablesEditorProps {
  variables: Record<string, any>;
  onChange: (variables: Record<string, any>) => void;
}

export function TemplateVariablesEditor({ variables, onChange }: TemplateVariablesEditorProps) {
  const { toast } = useToast();
  const [newVariableKey, setNewVariableKey] = useState("");
  const [newVariableValue, setNewVariableValue] = useState("");

  // Convert variables object to array for easier manipulation
  const variablesArray = Object.entries(variables || {}).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
    originalValue: value,
  }));

  const handleVariableChange = (index: number, key: string, value: string) => {
    const updatedVariables = { ...variables };
    
    // Remove old key if it changed
    if (variablesArray[index].key !== key && variablesArray[index].key in updatedVariables) {
      delete updatedVariables[variablesArray[index].key];
    }
    
    // Set new value with the right type
    try {
      // Try to parse as JSON if it starts with { or [
      if ((value.startsWith("{") && value.endsWith("}")) || 
          (value.startsWith("[") && value.endsWith("]"))) {
        updatedVariables[key] = JSON.parse(value);
      } else {
        updatedVariables[key] = value;
      }
    } catch (e) {
      // If parsing fails, use the raw string
      updatedVariables[key] = value;
    }
    
    onChange(updatedVariables);
  };

  const handleDeleteVariable = (key: string) => {
    const updatedVariables = { ...variables };
    delete updatedVariables[key];
    onChange(updatedVariables);
    
    toast({
      title: "Variable deleted",
      description: `Variable "${key}" has been removed.`
    });
  };

  const handleAddVariable = () => {
    if (!newVariableKey.trim()) {
      toast({
        title: "Invalid variable name",
        description: "Please enter a valid variable name.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate variable name format (should contain a dot)
    if (!newVariableKey.includes(".")) {
      toast({
        title: "Invalid variable format",
        description: "Variable name should be in format 'Element.property' (e.g., 'Heading.text')",
        variant: "destructive"
      });
      return;
    }

    const updatedVariables = { ...variables };
    updatedVariables[newVariableKey] = newVariableValue;
    onChange(updatedVariables);
    
    // Reset form
    setNewVariableKey("");
    setNewVariableValue("");
    
    toast({
      title: "Variable added",
      description: `Variable "${newVariableKey}" has been added.`
    });
  };

  // Sort variables by key for better organization
  const sortedVariables = [...variablesArray].sort((a, b) => a.key.localeCompare(b.key));
  
  // Group variables by element name for better organization
  const groupedVariables: Record<string, typeof variablesArray> = {};
  
  sortedVariables.forEach(item => {
    const elementName = item.key.split('.')[0];
    if (!groupedVariables[elementName]) {
      groupedVariables[elementName] = [];
    }
    groupedVariables[elementName].push(item);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Template Variables</h3>
        <div className="text-sm text-muted-foreground">
          {Object.keys(variables || {}).length} variables found
        </div>
      </div>

      {/* Variables list */}
      <div className="space-y-6">
        {Object.entries(groupedVariables).map(([elementName, items]) => (
          <div key={elementName} className="border p-4 rounded-md">
            <h4 className="text-sm font-medium mb-2">{elementName}</h4>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.key} className="flex items-center gap-2">
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`var-key-${index}`} className="sr-only">
                      Variable Name
                    </Label>
                    <Input
                      id={`var-key-${index}`}
                      value={item.key}
                      onChange={(e) => handleVariableChange(index, e.target.value, item.value)}
                      placeholder="Variable name (e.g., Element.property)"
                    />
                  </div>
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`var-value-${index}`} className="sr-only">
                      Variable Value
                    </Label>
                    <Input
                      id={`var-value-${index}`}
                      value={item.value}
                      onChange={(e) =>
                        handleVariableChange(index, item.key, e.target.value)
                      }
                      placeholder="Value"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteVariable(item.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add new variable form */}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium mb-2">Add New Variable</h4>
        <div className="flex items-end gap-2">
          <div className="grid gap-1 flex-1">
            <Label htmlFor="new-var-key">Variable Name</Label>
            <Input
              id="new-var-key"
              value={newVariableKey}
              onChange={(e) => setNewVariableKey(e.target.value)}
              placeholder="Element.property (e.g., Heading.text)"
            />
          </div>
          <div className="grid gap-1 flex-1">
            <Label htmlFor="new-var-value">Value</Label>
            <Input
              id="new-var-value"
              value={newVariableValue}
              onChange={(e) => setNewVariableValue(e.target.value)}
              placeholder="Enter value"
            />
          </div>
          <Button onClick={handleAddVariable}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
