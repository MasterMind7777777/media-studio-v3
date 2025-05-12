
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, ChevronRight, ChevronLeft } from "lucide-react";
import { importCreatomateTemplate, parseCurlCommand } from "@/services/creatomate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateVariablesEditor } from "./TemplateVariablesEditor";

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateImportDialog({ open, onOpenChange }: TemplateImportDialogProps) {
  const { toast } = useToast();
  const [curlCommand, setCurlCommand] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [step, setStep] = useState<"parse" | "variables" | "import">("parse");
  const [variables, setVariables] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();
  const [importError, setImportError] = useState<string | null>(null);
  const [isParsingCurl, setIsParsingCurl] = useState(false);

  // Examples of valid CURL commands
  const getExample = `curl -X GET 'https://api.creatomate.com/v1/templates/36481fd5-8dfe-4359-9544-76d8857acf3d' -H 'Authorization: Bearer YOUR_API_KEY'`;
  
  const postExample = `curl -X POST https://api.creatomate.com/v1/renders \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
  "template_id": "36481fd5-8dfe-4359-9544-76d8857acf3d",
  "modifications": {
    "Background.source": "https://creatomate.com/files/assets/faf193ec-3342-492c-8c3a-ae1b619b71eb",
    "Avatar-1.source": "https://creatomate.com/files/assets/6e559c7e-5416-4d64-8235-096bfba75d51",
    "Heading.text": "Jessica for the post",
    "Subheading.text": "Ready to have some fun?"
  }
}'`;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setTemplateId(null);
        setCurlCommand("");
        setVariables({});
        setStep("parse");
        setImportError(null);
      }, 300); // Delay reset until dialog close animation completes
    }
  }, [open]);

  // Parse CURL command using the edge function
  const handleParseCurl = async () => {
    try {
      setImportError(null);
      setIsParsingCurl(true);
      
      if (!curlCommand.trim()) {
        setTemplateId(null);
        toast({
          title: "Empty CURL command",
          description: "Please enter a CURL command.",
          variant: "destructive"
        });
        return;
      }

      // Use the new parse-curl edge function
      const { templateId: parsedId, modifications } = await parseCurlCommand(curlCommand);
      
      if (parsedId) {
        setTemplateId(parsedId);
        setVariables(modifications || {});
        
        toast({
          title: "CURL command parsed successfully",
          description: `Template ID: ${parsedId}`
        });
        
        // If we have both template ID and modifications, go to variables step
        if (Object.keys(modifications || {}).length > 0) {
          setStep("variables");
        }
      } else if (Object.keys(modifications || {}).length > 0) {
        setVariables(modifications);
        toast({
          title: "Parsed modifications from CURL",
          description: "No template ID found, but extracted variables successfully."
        });
      } else {
        setTemplateId(null);
        toast({
          title: "Invalid CURL command",
          description: "Could not extract template ID or modifications from the CURL command.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setTemplateId(null);
      toast({
        title: "Error parsing CURL command",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsParsingCurl(false);
    }
  };

  // Extract template ID using regex as fallback to our edge function
  const extractTemplateIdFallback = () => {
    try {
      // Pattern 1: Extract from URL - templates/{id}
      const templateUrlMatch = curlCommand.match(/templates\/([a-f0-9-]{36})/i);
      
      // Pattern 2: Extract from JSON - "template_id": "{id}"
      const templateJsonMatch = curlCommand.match(/"template_id":\s*"([a-f0-9-]{36})"/i);
      
      // Use the first match found
      if (templateUrlMatch && templateUrlMatch[1]) {
        return templateUrlMatch[1];
      } else if (templateJsonMatch && templateJsonMatch[1]) {
        return templateJsonMatch[1];
      }
      
      return null;
    } catch (error) {
      console.error("Error extracting template ID:", error);
      return null;
    }
  };

  // Copy example to clipboard
  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example);
    setCurlCommand(example);
    toast({
      title: "Example copied",
      description: "CURL example copied to clipboard and input field."
    });
  };

  // Handle template import
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }
      
      // Send both the template ID and CURL command for better variable extraction
      return await importCreatomateTemplate(templateId, curlCommand);
    },
    onSuccess: () => {
      setImportError(null);
      toast({
        title: "Template imported successfully",
        description: "The template has been imported and is now available in your library."
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      onOpenChange(false);
      setCurlCommand("");
      setTemplateId(null);
      setVariables({});
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Unknown error occurred";
      setImportError(errorMessage);
      toast({
        title: "Error importing template",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Move to next step
  const handleNextStep = () => {
    if (step === "parse" && templateId) {
      setStep("variables");
    } else if (step === "variables") {
      setStep("import");
    }
  };

  // Move to previous step
  const handlePrevStep = () => {
    if (step === "variables") {
      setStep("parse");
    } else if (step === "import") {
      setStep("variables");
    }
  };

  // Handle template import
  const handleImport = () => {
    setImportError(null);
    if (templateId) {
      importMutation.mutate();
    } else {
      toast({
        title: "No template ID",
        description: "Please parse the CURL command first to extract the template ID.",
        variant: "destructive"
      });
    }
  };

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    if (step === "parse") {
      return !templateId;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setImportError(null);
        setTemplateId(null);
        setCurlCommand("");
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Template from Creatomate</DialogTitle>
          <DialogDescription>
            Paste a CURL command from Creatomate API to import a template. Both GET and POST commands are supported.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {importError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error importing template</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

          {step === "parse" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => copyExample(getExample)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  GET Example
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => copyExample(postExample)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  POST Example
                </Button>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="curl-command">CURL Command</Label>
                <Textarea
                  id="curl-command"
                  placeholder="curl -X GET 'https://api.creatomate.com/v1/templates/your-template-id' -H 'Authorization: Bearer YOUR_API_KEY'"
                  value={curlCommand}
                  onChange={(e) => setCurlCommand(e.target.value)}
                  className="font-mono text-sm h-40"
                />
                <p className="text-xs text-muted-foreground">
                  Supports both GET requests to /templates/{"{id}"} and POST requests with "template_id" in JSON body.
                </p>
              </div>
              
              {templateId && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800">Template ID detected: <span className="font-mono">{templateId}</span></p>
                </div>
              )}
              
              {Object.keys(variables).length > 0 && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800">{Object.keys(variables).length} variables detected</p>
                </div>
              )}
            </div>
          )}

          {step === "variables" && (
            <div className="space-y-4">
              <div className="p-2 bg-green-50 border border-green-200 rounded-md mb-4">
                <p className="text-sm font-medium text-green-800">Template ID: <span className="font-mono">{templateId}</span></p>
              </div>
              
              <TemplateVariablesEditor 
                variables={variables} 
                onChange={setVariables} 
              />
            </div>
          )}

          {step === "import" && (
            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Template Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[100px_1fr] gap-1">
                    <span className="font-medium">Template ID:</span>
                    <span className="font-mono text-xs break-all">{templateId}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1">
                    <span className="font-medium">Variables:</span>
                    <span>{Object.keys(variables).length}</span>
                  </div>
                </div>
              </div>
              
              <Alert className="bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-600">Ready to import</AlertTitle>
                <AlertDescription className="text-amber-800">
                  The template will be imported with {Object.keys(variables).length} variables. 
                  Click "Import Template" to proceed or go back to make changes.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center sm:justify-between">
          {step !== "parse" ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrevStep}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleParseCurl}
              disabled={!curlCommand.trim().length || isParsingCurl}
            >
              {isParsingCurl ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                "Parse CURL"
              )}
            </Button>
          )}
          
          {step === "import" ? (
            <Button 
              type="button"
              onClick={handleImport}
              disabled={!templateId || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Template"
              )}
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={handleNextStep}
              disabled={isNextDisabled()}
              className="flex items-center gap-1"
            >
              {step === "parse" ? "Review Variables" : "Continue"} 
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
