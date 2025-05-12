
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTemplate, useCreateRenderJob, useUpdateTemplate } from "@/hooks/api";
import { toast } from "@/components/ui/sonner";
import { MediaAsset, Template } from "@/types";
import { MediaSelectionDialog } from "@/components/Media/MediaSelectionDialog";
import { TemplateHeader } from "@/components/Templates/TemplateHeader";
import { TemplatePreview } from "@/components/Templates/TemplatePreview";
import { TemplateVariablesEditor } from "@/components/Templates/TemplateVariablesEditor";
import { useTemplateVariables } from "@/hooks/templates";

export default function TemplateCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management
  const [selectedMedia, setSelectedMedia] = useState<Record<string, MediaAsset>>({});
  const [updatedTemplate, setUpdatedTemplate] = useState<Template | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [currentMediaKey, setCurrentMediaKey] = useState<string>("");
  
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
  
  // Fetch template data 
  const { 
    data: template, 
    isLoading, 
    error,
    isError
  } = useTemplate(id);

  // API mutations
  const { 
    mutate: updateTemplate,
    isPending: isUpdating
  } = useUpdateTemplate();

  const { 
    mutate: createRenderJob, 
    isPending: isRendering 
  } = useCreateRenderJob();
  
  // Update local state when template data is loaded
  useEffect(() => {
    if (template && !updatedTemplate) {
      console.log(`Template data loaded successfully: ${template.name}`);
      setUpdatedTemplate(template);
    }
  }, [template, updatedTemplate]);
  
  // Extract variables by type
  const { textVariables, mediaVariables, colorVariables } = useTemplateVariables(updatedTemplate);
  
  // Handle template loading errors
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

  // Navigation handler
  const handleBack = () => {
    navigate("/create");
  };
  
  // Variable update handlers
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
  
  // Media selection handlers
  const handleMediaSelect = (variableKey: string) => {
    setCurrentMediaKey(variableKey);
    setMediaDialogOpen(true);
  };
  
  const handleMediaDialogSelect = (mediaAsset: MediaAsset) => {
    if (!currentMediaKey || !updatedTemplate) return;
    
    // Update the selected media
    setSelectedMedia({
      ...selectedMedia,
      [currentMediaKey]: mediaAsset
    });
    
    // Update the template variable with the media URL
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

  // Render handler
  const handleRender = () => {
    if (updatedTemplate && JSON.stringify(template?.variables) !== JSON.stringify(updatedTemplate.variables)) {
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

  // Loading state
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <TemplateHeader 
        templateName={template.name}
        onBack={handleBack}
      />
      
      {/* Main content area with preview and editing panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Preview Section */}
        <div className="md:col-span-8">
          <TemplatePreview 
            previewImageUrl={updatedTemplate.preview_image_url}
            width={updatedTemplate.platforms[0]?.width}
            height={updatedTemplate.platforms[0]?.height}
          />
        </div>
        
        {/* Editing Panel */}
        <div className="md:col-span-4">
          <TemplateVariablesEditor
            textVariables={textVariables}
            mediaVariables={mediaVariables}
            colorVariables={colorVariables}
            platforms={updatedTemplate.platforms}
            selectedMedia={selectedMedia}
            onTextChange={handleTextChange}
            onColorChange={handleColorChange}
            onMediaSelect={handleMediaSelect}
            isRendering={isRendering}
            isUpdating={isUpdating}
            onRender={handleRender}
          />
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
