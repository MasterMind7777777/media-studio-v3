
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateVariablesEditorProps {
  variables: Record<string, any>;
  onChange: (variables: Record<string, any>) => void;
}

export function TemplateVariablesEditor({ variables, onChange }: TemplateVariablesEditorProps) {
  const { toast } = useToast();
  const [newVariableKey, setNewVariableKey] = useState("");
  const [newVariableValue, setNewVariableValue] = useState("");

  const handleInputChange = (key: string, value: string) => {
    const updatedVariables = {
      ...variables,
      [key]: value
    };
    onChange(updatedVariables);
  };

  const handleDeleteVariable = (key: string) => {
    // Create a new variables object without the deleted key
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

    // Add the new variable
    const updatedVariables = {
      ...variables,
      [newVariableKey]: newVariableValue
    };
    onChange(updatedVariables);
    setNewVariableKey("");
    setNewVariableValue("");
    
    toast({
      title: "Variable added",
      description: `Variable "${newVariableKey}" has been added.`
    });
  };

  // Sort variables by key for better organization
  const sortedVariables = Object.keys(variables).sort();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sortedVariables.map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor={`var-${key}`}>{key}</Label>
              <Input
                id={`var-${key}`}
                value={variables[key] || ''}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder="Value"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleDeleteVariable(key)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      {/* Add new variable section */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">Add New Variable</h3>
        <div className="flex items-end space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="new-key">Variable Name</Label>
            <Input
              id="new-key"
              value={newVariableKey}
              onChange={(e) => setNewVariableKey(e.target.value)}
              placeholder="e.g., Heading.text"
            />
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="new-value">Default Value</Label>
            <Input
              id="new-value"
              value={newVariableValue}
              onChange={(e) => setNewVariableValue(e.target.value)}
              placeholder="Value"
            />
          </div>
          <Button
            type="button"
            onClick={handleAddVariable}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
