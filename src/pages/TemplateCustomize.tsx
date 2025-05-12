import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, Cog, Image, Type } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplate, useCreateRenderJob } from "@/hooks/api";

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(1);
  
  // Fetch template data using our custom hook
  const { 
    data: template, 
    isLoading, 
    error 
  } = useTemplate(id);

  const { 
    mutate: createRenderJob, 
    isPending: isRendering 
  } = useCreateRenderJob();
  
  // If template is loading or not found, show loading or redirect
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
  
  if (error || !template) {
    navigate("/create");
    return null;
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

  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    } else {
      // Final step, start render job
      createRenderJob({
        templateId: template.id,
        variables: template.variables,
        platforms: template.platforms
      }, {
        onSuccess: () => {
          // Navigate to dashboard or projects page after successful render job creation
          navigate("/");
        }
      });
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
          "3"
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="md:col-span-1">
        <Card className="p-4 h-full">
          <h3 className="font-medium mb-4">Required Media</h3>
          <div className="space-y-4">
            {Object.entries(template.variables)
              .filter(([_, v]) => v.type === "media")
              .map(([key, value]) => (
                <div key={key} className="border rounded-md p-3">
                  <div className="text-sm font-medium mb-2">{key.replace(/_/g, ' ')}</div>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" className="w-full">
                      Select Media
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card className="h-full">
          <Tabs defaultValue="my-uploads">
            <TabsList className="w-full">
              <TabsTrigger value="my-uploads" className="flex-1">My Uploads</TabsTrigger>
              <TabsTrigger value="content-packs" className="flex-1">Content Packs</TabsTrigger>
            </TabsList>
            <TabsContent value="my-uploads" className="p-4">
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-md">
                <Image className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">Drop files to upload</h3>
                <p className="text-muted-foreground mb-4">or click to browse files</p>
                <Button>Upload Files</Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Supported: JPG, PNG, WebP, MP4, MOV up to 100MB
                </p>
              </div>
              <div className="mt-4 text-center text-muted-foreground">
                No uploads yet
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
                src={template.preview_image_url} 
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
              {template.platforms[0]?.width} × {template.platforms[0]?.height}
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-4">
        <Card className="h-full">
          <div className="p-4 border-b">
            <h3 className="font-medium">Edit Template</h3>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-sm font-medium flex items-center mb-2">
                <Type className="h-4 w-4 mr-1" /> Text Elements
              </h4>
              <div className="space-y-3">
                {Object.entries(template.variables)
                  .filter(([_, v]) => v.type === "text")
                  .map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm text-muted-foreground">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input 
                        type="text" 
                        defaultValue={value.default}
                        className="w-full px-3 py-1 border rounded-md text-sm"
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center mb-2">
                <Image className="h-4 w-4 mr-1" /> Media Elements
              </h4>
              <div className="space-y-3">
                {Object.entries(template.variables)
                  .filter(([_, v]) => v.type === "media")
                  .map(([key, _]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-grow">
                        <div className="text-sm">{key.replace(/_/g, ' ')}</div>
                      </div>
                      <Button size="sm" variant="outline">Change</Button>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center mb-2">
                <Cog className="h-4 w-4 mr-1" /> Settings
              </h4>
              <div className="space-y-3">
                {Object.entries(template.variables)
                  .filter(([_, v]) => v.type === "color")
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm">{key.replace(/_/g, ' ')}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color"
                          defaultValue={value.default}
                          className="w-8 h-8 rounded-md cursor-pointer"
                        />
                        <input 
                          type="text"
                          defaultValue={value.default}
                          className="w-24 px-2 py-1 border rounded-md text-xs"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
          {activeStep === 2 && (
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
                        src={template.preview_image_url} 
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
                      {template.platforms[0]?.width} × {template.platforms[0]?.height}
                    </div>
                  </div>
                </Card>
              </div>
              <div className="md:col-span-4">
                <Card className="h-full">
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Edit Template</h3>
                  </div>
                  <div className="p-4 space-y-6">
                    <div>
                      <h4 className="text-sm font-medium flex items-center mb-2">
                        <Type className="h-4 w-4 mr-1" /> Text Elements
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(template.variables)
                          .filter(([_, v]) => v.type === "text")
                          .map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <label className="text-sm text-muted-foreground">
                                {key.replace(/_/g, ' ')}
                              </label>
                              <input 
                                type="text" 
                                defaultValue={value.default}
                                className="w-full px-3 py-1 border rounded-md text-sm"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium flex items-center mb-2">
                        <Image className="h-4 w-4 mr-1" /> Media Elements
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(template.variables)
                          .filter(([_, v]) => v.type === "media")
                          .map(([key, _]) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                                <Image className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-grow">
                                <div className="text-sm">{key.replace(/_/g, ' ')}</div>
                              </div>
                              <Button size="sm" variant="outline">Change</Button>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium flex items-center mb-2">
                        <Cog className="h-4 w-4 mr-1" /> Settings
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(template.variables)
                          .filter(([_, v]) => v.type === "color")
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <label className="text-sm">{key.replace(/_/g, ' ')}</label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="color"
                                  defaultValue={value.default}
                                  className="w-8 h-8 rounded-md cursor-pointer"
                                />
                                <input 
                                  type="text"
                                  defaultValue={value.default}
                                  className="w-24 px-2 py-1 border rounded-md text-xs"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
          {activeStep === 3 && (
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
          )}
        </div>
        
        <div className="flex justify-end mt-8">
          <Button 
            className="gap-2 bg-studio-600 hover:bg-studio-700"
            onClick={handleNext}
            disabled={isRendering}
          >
            {isRendering 
              ? "Starting Render..." 
              : activeStep === 3 
                ? 'Start Render' 
                : 'Next Step'
            }
            {!isRendering && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
