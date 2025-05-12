
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Type, Image, Cog, Check, Loader2 } from "lucide-react";
import { MediaAsset } from "@/types";
import { TemplateVariableSection } from "@/hooks/templates/useTemplateVariables";
import { Card } from "@/components/ui/card";

interface TemplateVariablesEditorProps {
  textVariables: TemplateVariableSection[];
  mediaVariables: TemplateVariableSection[];
  colorVariables: TemplateVariableSection[];
  platforms: any[];
  selectedMedia: Record<string, MediaAsset>;
  onTextChange: (key: string, value: string) => void;
  onColorChange: (key: string, value: string) => void;
  onMediaSelect: (key: string) => void;
  isRendering: boolean;
  isUpdating: boolean;
  onRender: () => void;
}

export function TemplateVariablesEditor({
  textVariables,
  mediaVariables,
  colorVariables,
  platforms,
  selectedMedia,
  onTextChange,
  onColorChange,
  onMediaSelect,
  isRendering,
  isUpdating,
  onRender
}: TemplateVariablesEditorProps) {
  // Accordion states
  const [textOpen, setTextOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);

  // Helper function to format variable display names
  const formatVariableName = (key: string) => {
    // Remove .source, .text, etc. suffixes for display
    const baseName = key.split('.')[0];
    // Replace underscores with spaces and capitalize first letter
    return baseName.replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium">Edit Template</h3>
      </div>
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Text Variables Section */}
        {textVariables.length > 0 && (
          <Collapsible open={textOpen} onOpenChange={setTextOpen} className="border rounded-md">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <h4 className="text-sm font-medium">Text Elements</h4>
              </div>
              <div className={`transform transition-transform ${textOpen ? 'rotate-180' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L1 4L2.4 2.6L6 6.2L9.6 2.6L11 4L6 9Z" fill="currentColor"/>
                </svg>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-3">
              {textVariables.map(({key, value}) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    {formatVariableName(key)}
                  </label>
                  <input 
                    type="text" 
                    value={value || ''}
                    onChange={(e) => onTextChange(key, e.target.value)}
                    className="w-full px-3 py-1 border rounded-md text-sm"
                  />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Media Variables Section */}
        {mediaVariables.length > 0 && (
          <Collapsible open={mediaOpen} onOpenChange={setMediaOpen} className="border rounded-md">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <h4 className="text-sm font-medium">Media Elements</h4>
              </div>
              <div className={`transform transition-transform ${mediaOpen ? 'rotate-180' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L1 4L2.4 2.6L6 6.2L9.6 2.6L11 4L6 9Z" fill="currentColor"/>
                </svg>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-3">
              {mediaVariables.map(({key, value}) => {
                const mediaAsset = selectedMedia[key];
                const displayName = formatVariableName(key);
                
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {value ? (
                        <img src={value} className="w-full h-full object-cover" alt={displayName} />
                      ) : (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm font-medium">{displayName}</div>
                      {mediaAsset && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {mediaAsset.name}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onMediaSelect(key)}
                    >
                      Change
                    </Button>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Color Variables Section */}
        {colorVariables.length > 0 && (
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="border rounded-md">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Cog className="h-4 w-4" />
                <h4 className="text-sm font-medium">Settings</h4>
              </div>
              <div className={`transform transition-transform ${settingsOpen ? 'rotate-180' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L1 4L2.4 2.6L6 6.2L9.6 2.6L11 4L6 9Z" fill="currentColor"/>
                </svg>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-3">
              {colorVariables.map(({key, value}) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm">{formatVariableName(key)}</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={value || '#000000'}
                      onChange={(e) => onColorChange(key, e.target.value)}
                      className="w-8 h-8 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={value || '#000000'}
                      onChange={(e) => onColorChange(key, e.target.value)}
                      className="w-24 px-2 py-1 border rounded-md text-xs"
                    />
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Output Options Section */}
        <Collapsible open={outputOpen} onOpenChange={setOutputOpen} className="border rounded-md">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <h4 className="text-sm font-medium">Output Options</h4>
            </div>
            <div className={`transform transition-transform ${outputOpen ? 'rotate-180' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L1 4L2.4 2.6L6 6.2L9.6 2.6L11 4L6 9Z" fill="currentColor"/>
              </svg>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground mb-2">
              Select the platforms where you want to render this template
            </p>
            {platforms.map(platform => (
              <div key={platform.id} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id={platform.id} 
                  className="rounded text-studio-600 focus:ring-studio-600"
                  defaultChecked
                />
                <label htmlFor={platform.id} className="text-sm">
                  {platform.name}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({platform.width}×{platform.height}) - {platform.aspect_ratio}
                  </span>
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
        
        {/* No variables notice */}
        {textVariables.length === 0 && mediaVariables.length === 0 && colorVariables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">This template has no editable elements</p>
          </div>
        )}
      </div>
      
      {/* Render Button */}
      <div className="p-4 mt-auto border-t">
        <Button 
          className="w-full gap-2 bg-studio-600 hover:bg-studio-700"
          onClick={onRender}
          disabled={isRendering || isUpdating}
        >
          {isRendering ? "Starting Render..." : 
          isUpdating ? "Saving Changes..." : "Start Render"}
          {(isRendering || isUpdating) && <Loader2 className="h-4 w-4 animate-spin" />}
        </Button>
      </div>
    </Card>
  );
}
