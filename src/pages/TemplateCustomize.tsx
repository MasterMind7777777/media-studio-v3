import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, Cog, Image, Type, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplate, useCreateRenderJob, useUpdateTemplate } from "@/hooks/api";
import { toast } from "@/components/ui/sonner";
import { MediaUploader } from "@/components/Media/MediaUploader";
import { MediaGallery } from "@/components/Media/MediaGallery";
import { MediaAsset, Template } from "@/types";

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  const [updatedTemplate, setUpdatedTemplate] = useState<Template | null>(null);
  
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
  
  // Check if we have any media variables at all
  const hasMediaVariables = useMemo(() => {
    return getMediaVariables.length > 0;
  }, [getMediaVariables]);

  // Handle template loading errors with better error messages
  useEffect(() => {
    if (isError && error) {
      console.error("Template loading error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Provide more specific error messages based on the error
      if (errorMessage.includes("not found")) {
        toast.error("Template not found", {
          description: `The template with ID ${id} could not be found. It may have been deleted or is unavailable.`,
        });
      } else {
        toast.error("Failed to load template", {
          description: errorMessage
        });
      }
      
      // Redirect after a short delay to allow the toast to be seen
      setTimeout(() => {
        navigate("/create");
      }, 1500);
    }
  }, [isError, error, id, navigate]);

  // If template is loading, show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <div className="mb-4">Loading template...</div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-studio-600 mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // If template is not found or there is an error, the redirect will happen via the useEffect
  // This prevents flashing of error UI before redirect
  
  if (!template || !updatedTemplate) {
    return null; // Return null while redirect happens via the useEffect
  }

  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  const handleBack = () => {
    if (activeStep === 1) {
      navigate("/create");
    } else {
      setActiveStep(activeStep - 1);
    }
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
  
  const handleMediaSelect = (variableKey: string, mediaAsset: MediaAsset) => {
    // Update the selected media
    setSelectedMedia({
      ...selectedMedia,
      [variableKey]: mediaAsset
    });
    
    // Update the template variable with the media URL
    if (!updatedTemplate) return;
    
    setUpdatedTemplate({
      ...updatedTemplate,
      variables: {
        ...updatedTemplate.variables,
        [`${variableKey}.source`]: mediaAsset.file_url
      }
    });
    
    toast.success("Media selected", {
      description: `${mediaAsset.name} added to ${variableKey.replace(/_/g, ' ')}`
    });
  };

  const handleNext = () => {
    // Save any changes to the template before proceeding to the next step
    if (updatedTemplate && JSON.stringify(template.variables) !== JSON.stringify(updatedTemplate.variables)) {
      updateTemplate({
        id: updatedTemplate.id,
        variables: updatedTemplate.variables
      }, {
        onSuccess: () => {
          toast.success("Template updated", {
            description: "Your changes have been saved."
          });
          
          if (activeStep < 3) {
            setActiveStep(activeStep + 1);
          }
        },
        onError: (error) => {
          toast.error("Failed to save changes", {
            description: error.message
          });
        }
      });
    } else {
      if (activeStep < 3) {
        setActiveStep(activeStep + 1);
      } else {
        // Final step, start render job
        createRenderJob({
          templateId: template.id,
          variables: updatedTemplate.variables,
          platforms: updatedTemplate.platforms
        }, {
          onSuccess: (renderJob) => {
            // Navigate to dashboard or projects page after successful render job creation
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
      }
    }
  };

  const renderSteps = () => (
    <div className="mb-8">
      <div className="flex items-center">
        <div 
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            activeStep >= 1 ? "bg-studio-600 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {activeStep > 1 ? <Check className="h-4 w-4" /> : "1"}
        </div>
        <div className={`flex-1 h-0.5 ${activeStep > 1 ? "bg-studio-600" : "bg-muted"}`}></div>
        <div 
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            activeStep >= 2 ? "bg-studio-600 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {activeStep > 2 ? <Check className="h-4 w-4" /> : "2"}
        </div>
        <div className={`flex-1 h-0.5 ${activeStep > 2 ? "bg-studio-600" : "bg-muted"}`}></div>
        <div 
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            activeStep >= 3 ? "bg-studio-600 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          3
        </div>
      </div>
      <div className="flex justify-between mt-2 text-sm">
        <div className="text-center" style={{ marginLeft: "-1rem" }}>Media Selection</div>
        <div className="text-center">Customization</div>
        <div className="text-center" style={{ marginRight: "-1rem" }}>Render Options</div>
      </div>
    </div>
  );

  const renderMediaSelectionStep = () => (
    <div className={`grid grid-cols-1 md:grid-cols-${hasMediaVariables ? '3' : '1'} gap-6 animate-fade-in`}>
      {hasMediaVariables && (
        <div className="md:col-span-1">
          <Card className="p-4 h-full">
            <h3 className="font-medium mb-4">Required Media</h3>
            <div className="space-y-4">
              {getMediaVariables.map(({key, property, value}) => {
                const isSelected = selectedMedia[key]?.file_url === value;
                const previewImage = value || (selectedMedia[key]?.thumbnail_url || selectedMedia[key]?.file_url);
                
                return (
                  <div key={key} className="border rounded-md p-3">
                    <div className="text-sm font-medium mb-2">{key.replace(/_/g, ' ')}</div>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt={key} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          // When this media element is clicked, set the active tab to "my-uploads"
                          // and focus on this particular media element for selection
                          const mediaTab = document.getElementById("media-tab-my-uploads");
                          if (mediaTab) {
                            (mediaTab as HTMLButtonElement).click();
                          }
                          
                          // Scroll to the media gallery area
                          const mediaGallery = document.getElementById("media-gallery");
                          if (mediaGallery) {
                            mediaGallery.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        {value ? "Change Media" : "Select Media"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
      
      <div className={`md:col-span-${hasMediaVariables ? '2' : '3'}`}>
        <Card className="h-full">
          <Tabs defaultValue="my-uploads">
            <TabsList className="w-full">
              <TabsTrigger id="media-tab-my-uploads" value="my-uploads" className="flex-1">My Uploads</TabsTrigger>
              <TabsTrigger value="content-packs" className="flex-1">Content Packs</TabsTrigger>
            </TabsList>
            <TabsContent value="my-uploads" className="p-4">
              <MediaUploader 
                onMediaSelected={(media) => {
                  // If there's a selected media variable, automatically apply this upload to it
                  if (getMediaVariables.length > 0) {
                    const firstMediaVar = getMediaVariables[0].key;
                    handleMediaSelect(firstMediaVar, media);
                  }
                }}
              />
              
              <div className="mt-6" id="media-gallery">
                <h3 className="font-medium mb-4">Your Uploads</h3>
                <MediaGallery 
                  onMediaSelect={(media) => {
                    // If there's a selected media variable, apply this selection to it
                    if (getMediaVariables.length > 0) {
                      const firstMediaVar = getMediaVariables[0].key;
                      handleMediaSelect(firstMediaVar, media);
                    }
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="content-packs" className="p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover-scale">
                  <div className="aspect-video bg-gradient-to-br from-studio-100 to-studio-300 flex items-center justify-center rounded-t-md">
                    <div className="text-studio-700 font-medium">Nature</div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm">Nature Collection</h4>
                    <p className="text-xs text-muted-foreground">12 items</p>
                  </div>
                </Card>
                <Card className="cursor-pointer hover-scale">
                  <div className="aspect-video bg-gradient-to-br from-amber-100 to-amber-300 flex items-center justify-center rounded-t-md">
                    <div className="text-amber-800 font-medium">Urban</div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm">Urban Scenes</h4>
                    <p className="text-xs text-muted-foreground">8 items</p>
                  </div>
                </Card>
                <Card className="cursor-pointer hover-scale">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center rounded-t-md">
                    <div className="text-blue-800 font-medium">Business</div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm">Business & Office</h4>
                    <p className="text-xs text-muted-foreground">15 items</p>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );

  const renderCustomizationStep = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
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
      <div className="md:col-span-4">
        <Card className="h-full">
          <div className="p-4 border-b">
            <h3 className="font-medium">Edit Template: {updatedTemplate.name}</h3>
          </div>
          <div className="p-4 space-y-6">
            {getTextVariables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center mb-2">
                  <Type className="h-4 w-4 mr-1" /> Text Elements
                </h4>
                <div className="space-y-3">
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
                </div>
              </div>
            )}
            
            {getMediaVariables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center mb-2">
                  <Image className="h-4 w-4 mr-1" /> Media Elements
                </h4>
                <div className="space-y-3">
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
                          onClick={() => {
                            setActiveStep(1); // Go back to media selection step
                            // Focus on this media element
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {getColorVariables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center mb-2">
                  <Cog className="h-4 w-4 mr-1" /> Settings
                </h4>
                <div className="space-y-3">
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
                </div>
              </div>
            )}
            
            {getTextVariables.length === 0 && getMediaVariables.length === 0 && getColorVariables.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">This template has no editable elements</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderRenderOptionsStep = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <Card className="p-6">
        <h3 className="font-medium mb-4">Output Formats</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Select the platforms where you want to render this template
        </p>
        <div className="space-y-3">
          {template.platforms.map(platform => (
            <div key={platform.id} className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id={platform.id} 
                className="rounded text-studio-600 focus:ring-studio-600"
                defaultChecked
              />
              <label htmlFor={platform.id} className="flex-1">
                {platform.name}
                <span className="text-xs text-muted-foreground ml-2">
                  ({platform.width}×{platform.height}) - {platform.aspect_ratio}
                </span>
              </label>
            </div>
          ))}
        </div>
        <div className="mt-6 p-3 border rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Need a custom size? <span className="text-studio-600">Contact support</span>
          </p>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-medium mb-4">Render Summary</h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Template</div>
            <div className="font-medium">{template.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Selected Platforms</div>
            <div>
              {template.platforms.map(platform => (
                <div key={platform.id} className="text-sm">
                  {platform.name} - {platform.width}×{platform.height}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="text-studio-600 font-medium">Estimated Time</div>
            <div className="text-sm">1-2 minutes for all formats</div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">{template.name}</h1>
          <div className="w-24"></div> {/* Empty div for spacing */}
        </div>
        
        {renderSteps()}
        
        <div className="min-h-[60vh]">
          {activeStep === 1 && renderMediaSelectionStep()}
          {activeStep === 2 && renderCustomizationStep()}
          {activeStep === 3 && renderRenderOptionsStep()}
        </div>
        
        <div className="flex justify-end mt-8">
          <Button 
            className="gap-2 bg-studio-600 hover:bg-studio-700"
            onClick={handleNext}
            disabled={isRendering || isUpdating}
          >
            {isRendering ? "Starting Render..." : 
             isUpdating ? "Saving Changes..." :
             activeStep === 3 ? 'Start Render' : 'Next Step'}
            {!isRendering && !isUpdating && <ChevronRight className="h-4 w-4" />}
            {(isRendering || isUpdating) && <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
