
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";
import { importCreatomateTemplate } from "@/services/creatomate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateImportDialog({ open, onOpenChange }: TemplateImportDialogProps) {
  const { toast } = useToast();
  const [curlCommand, setCurlCommand] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [importError, setImportError] = useState<string | null>(null);

  // Examples of valid CURL commands
  const getExample = `curl -X GET 'https://api.creatomate.com/v1/templates/36481fd5-8dfe-4359-9544-76d8857acf3d' -H 'Authorization: Bearer YOUR_API_KEY'`;
  
  const postExample = `curl -X POST https://api.creatomate.com/v1/renders \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
  "template_id": "36481fd5-8dfe-4359-9544-76d8857acf3d",
  "modifications": {
    "Text.text": "Your text here"
  }
}'`;

  // Parse CURL command to extract template ID
  const handleParseCurl = () => {
    try {
      setImportError(null);
      
      if (!curlCommand.trim()) {
        setTemplateId(null);
        toast({
          title: "Empty CURL command",
          description: "Please enter a CURL command.",
          variant: "destructive"
        });
        return;
      }

      // Try to extract templateId using different patterns
      let extractedId: string | null = null;
      
      // Pattern 1: Extract from URL - templates/{id}
      const templateUrlMatch = curlCommand.match(/templates\/([a-f0-9-]{36})/i);
      
      // Pattern 2: Extract from JSON - "template_id": "{id}"
      const templateJsonMatch = curlCommand.match(/"template_id":\s*"([a-f0-9-]{36})"/i);
      
      // Use the first match found
      if (templateUrlMatch && templateUrlMatch[1]) {
        extractedId = templateUrlMatch[1];
      } else if (templateJsonMatch && templateJsonMatch[1]) {
        extractedId = templateJsonMatch[1];
      }

      if (extractedId) {
        // Validate UUID format (36 characters with hyphens)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(extractedId)) {
          setTemplateId(extractedId);
          toast({
            title: "CURL command parsed successfully",
            description: `Template ID: ${extractedId}`
          });
        } else {
          setTemplateId(null);
          toast({
            title: "Invalid template ID format",
            description: "The extracted ID does not match the expected UUID format.",
            variant: "destructive"
          });
        }
      } else {
        setTemplateId(null);
        toast({
          title: "Invalid CURL command",
          description: "Could not extract template ID from the CURL command. Make sure it includes a template_id.",
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

  // Mutation for importing template
  const importMutation = useMutation({
    mutationFn: async (id: string) => {
      return await importCreatomateTemplate(id);
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

  // Handle template import
  const handleImport = () => {
    setImportError(null);
    if (templateId) {
      importMutation.mutate(templateId);
    } else {
      toast({
        title: "No template ID",
        description: "Please parse the CURL command first to extract the template ID.",
        variant: "destructive"
      });
    }
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
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Import Template from Creatomate</DialogTitle>
          <DialogDescription>
            Paste a CURL command from Creatomate API to import a template. Both GET and POST commands are supported.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error importing template</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

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
        </div>
        
        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleParseCurl}
            disabled={!curlCommand.trim().length}
          >
            Parse CURL
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
