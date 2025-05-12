
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Image, Type, Loader2, Cog } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useTemplate, useCreateRenderJob, useUpdateTemplate } from "@/hooks/api";
import { toast } from "@/components/ui/sonner";
import { MediaAsset, Template } from "@/types";
import { MediaSelectionDialog } from "@/components/Media/MediaSelectionDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  const [updatedTemplate, setUpdatedTemplate] = useState<Template | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [currentMediaKey, setCurrentMediaKey] = useState<string>("");
  
  // Accordion states
  const [textOpen, setTextOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);

  // Validate template ID
  useEffect(() => {
    if (!id) {
      console.error("Template ID is missing from route parameters");
      toast.error("Missing template information", {
        description: "No template ID was provided."
      });
      navigate("/create");
    } else {
      console.log(`TemplateCustomize page loaded with template ID: ${id}`);
    }
  }, [id, navigate]);
  
  // Fetch template data using our custom hook with improved error handling
  const { 
    data: template, 
    isLoading, 
    error,
    isError
  } = useTemplate(id);

  const { 
    mutate: updateTemplate,
    isPending: isUpdating
  } = useUpdateTemplate();

  const { 
    mutate: createRenderJob, 
    isPending: isRendering 
  } = useCreateRenderJob();
  
  // Update our local state when template data is loaded
  useEffect(() => {
    if (template && !updatedTemplate) {
      console.log(`Template data loaded successfully: ${template.name}`);
      setUpdatedTemplate(template);
    }
  }, [template, updatedTemplate]);
  
  // Helper functions to extract variables by type from the flattened structure
  const getTextVariables = useMemo(() => {
    if (!updatedTemplate?.variables) return [];
    
    return Object.entries(updatedTemplate.variables)
      .filter(([key, value]) => key.includes('.text'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'text',
        value
      }));
  }, [updatedTemplate?.variables]);
  
  const getMediaVariables = useMemo(() => {
    if (!updatedTemplate?.variables) return [];
    
    return Object.entries(updatedTemplate.variables)
      .filter(([key, value]) => key.includes('.source'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'source',
        value
      }));
  }, [updatedTemplate?.variables]);
  
  const getColorVariables = useMemo(() => {
    if (!updatedTemplate?.variables) return [];
    
    return Object.entries(updatedTemplate.variables)
      .filter(([key, value]) => key.includes('.fill'))
      .map(([key, value]) => ({
        key: key.split('.')[0],
        property: 'fill',
        value
      }));
  }, [updatedTemplate?.variables]);

  // Handle template loading errors with better error messages
  useEffect(() => {
    if (isError && error) {
      console.error("Template loading error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("not found")) {
        toast.error("Template not found", {
          description: `The template with ID ${id} could not be found. It may have been deleted or is unavailable.`,
        });
      } else {
        toast.error("Failed to load template", {
          description: errorMessage
        });
      }
      
      setTimeout(() => {
        navigate("/create");
      }, 1500);
    }
  }, [isError, error, id, navigate]);

  // If template is loading, show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="text-center">
          <div className="mb-4">Loading template...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-studio-600 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!template || !updatedTemplate) {
    return null; // Return null while redirect happens via the useEffect
  }

  const handleBack = () => {
    navigate("/create");
  };
  
  const handleTextChange = (variableKey: string, value: string) => {
    if (!updatedTemplate) return;
    
    setUpdatedTemplate({
      ...updatedTemplate,
      variables: {
        ...updatedTemplate.variables,
        [`${variableKey}.text`]: value
      }
    });
  };
  
  const handleColorChange = (variableKey: string, value: string) => {
    if (!updatedTemplate) return;
    
    setUpdatedTemplate({
      ...updatedTemplate,
      variables: {
        ...updatedTemplate.variables,
        [`${variableKey}.fill`]: value
      }
    });
  };
  
  const handleMediaSelect = (variableKey: string) => {
    setCurrentMediaKey(variableKey);
    setMediaDialogOpen(true);
  };
  
  const handleMediaDialogSelect = (mediaAsset: MediaAsset) => {
    if (!currentMediaKey) return;
    
    // Update the selected media
    setSelectedMedia({
      ...selectedMedia,
      [currentMediaKey]: mediaAsset
    });
    
    // Update the template variable with the media URL
    if (!updatedTemplate) return;
    
    setUpdatedTemplate({
      ...updatedTemplate,
      variables: {
        ...updatedTemplate.variables,
        [`${currentMediaKey}.source`]: mediaAsset.file_url
      }
    });
    
    toast.success("Media selected", {
      description: `${mediaAsset.name} added to ${currentMediaKey.replace(/_/g, ' ')}`
    });
  };

  const handleRender = () => {
    if (updatedTemplate && JSON.stringify(template.variables) !== JSON.stringify(updatedTemplate.variables)) {
      updateTemplate({
        id: updatedTemplate.id,
        variables: updatedTemplate.variables
      }, {
        onSuccess: () => {
          toast.success("Template updated", {
            description: "Your changes have been saved."
          });
          
          // Start the render job after saving the template
          startRender();
        },
        onError: (error) => {
          toast.error("Failed to save changes", {
            description: error.message
          });
        }
      });
    } else {
      // If no changes, just start the render
      startRender();
    }
  };
  
  const startRender = () => {
    if (!updatedTemplate) return;
    
    createRenderJob({
      templateId: updatedTemplate.id,
      variables: updatedTemplate.variables,
      platforms: updatedTemplate.platforms
    }, {
      onSuccess: (renderJob) => {
        toast.success("Render started", {
          description: "Your render job has been created and is processing."
        });
        navigate(`/projects?job=${renderJob.id}`);
      },
      onError: (error) => {
        toast.error("Failed to start render", {
          description: error.message
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" className="gap-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-bold">{template.name}</h1>
        <div className="w-24"></div> {/* Empty div for spacing */}
      </div>
      
      {/* Main content area with preview and editing panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Preview Section */}
        <div className="md:col-span-8">
          <Card className="h-full">
            <div className="aspect-video bg-black/80 rounded-t-md flex items-center justify-center">
              <div className="text-white text-center p-8">
                <div className="text-xl font-medium mb-4">Preview</div>
                <p className="text-white/70 mb-4">
                  Creatomate Preview SDK would be integrated here
                </p>
                <img 
                  src={updatedTemplate.preview_image_url} 
                  alt="Preview" 
                  className="max-w-full max-h-60 mx-auto rounded-md shadow-lg"
                />
              </div>
            </div>
            <div className="p-4 flex items-center justify-between border-t">
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Play</Button>
                <Button size="sm" variant="outline">Fullscreen</Button>
              </div>
              <div className="text-muted-foreground text-sm">
                {updatedTemplate.platforms[0]?.width} × {updatedTemplate.platforms[0]?.height}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Editing Panel */}
        <div className="md:col-span-4">
          <Card className="h-full">
            <div className="p-4 border-b">
              <h3 className="font-medium">Edit Template: {updatedTemplate.name}</h3>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Text Variables Section */}
              {getTextVariables.length > 0 && (
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
                    {getTextVariables.map(({key, value}) => (
                      <div key={key} className="space-y-1">
                        <label className="text-sm text-muted-foreground">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <input 
                          type="text" 
                          value={value || ''}
                          onChange={(e) => handleTextChange(key, e.target.value)}
                          className="w-full px-3 py-1 border rounded-md text-sm"
                        />
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
              
              {/* Media Variables Section */}
              {getMediaVariables.length > 0 && (
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
                    {getMediaVariables.map(({key, value}) => {
                      const mediaAsset = selectedMedia[key];
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {value ? (
                              <img src={value} className="w-full h-full object-cover" alt={key} />
                            ) : (
                              <Image className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="text-sm">{key.replace(/_/g, ' ')}</div>
                            {mediaAsset && (
                              <div className="text-xs text-muted-foreground">{mediaAsset.name}</div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMediaSelect(key)}
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
              {getColorVariables.length > 0 && (
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
                    {getColorVariables.map(({key, value}) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-sm">{key.replace(/_/g, ' ')}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color"
                            value={value || '#000000'}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-8 h-8 rounded-md cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={value || '#000000'}
                            onChange={(e) => handleColorChange(key, e.target.value)}
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
                  {template.platforms.map(platform => (
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
              {getTextVariables.length === 0 && getMediaVariables.length === 0 && getColorVariables.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">This template has no editable elements</p>
                </div>
              )}
            </div>
            
            {/* Render Button */}
            <div className="p-4 mt-auto border-t">
              <Button 
                className="w-full gap-2 bg-studio-600 hover:bg-studio-700"
                onClick={handleRender}
                disabled={isRendering || isUpdating}
              >
                {isRendering ? "Starting Render..." : 
                 isUpdating ? "Saving Changes..." : "Start Render"}
                {(isRendering || isUpdating) && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Media Selection Dialog */}
      <MediaSelectionDialog 
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        onMediaSelect={handleMediaDialogSelect}
        title={`Select Media for ${currentMediaKey?.replace(/_/g, ' ') || ''}`}
      />
    </div>
  );
}
