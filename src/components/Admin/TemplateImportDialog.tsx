
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { importCreatomateTemplate } from "@/services/creatomate";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateImportDialog({ open, onOpenChange }: TemplateImportDialogProps) {
  const { toast } = useToast();
  const [curlCommand, setCurlCommand] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Parse CURL command to extract template ID
  const handleParseCurl = () => {
    try {
      // Simple regex to extract template ID from CURL command
      const templateIdMatch = curlCommand.match(/templates\/([a-zA-Z0-9-]+)/);
      if (templateIdMatch && templateIdMatch[1]) {
        setTemplateId(templateIdMatch[1]);
        toast({
          title: "CURL command parsed",
          description: `Template ID: ${templateIdMatch[1]}`
        });
      } else {
        setTemplateId(null);
        toast({
          title: "Invalid CURL command",
          description: "Could not extract template ID from the CURL command.",
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

  // Mutation for importing template
  const importMutation = useMutation({
    mutationFn: async (id: string) => {
      return await importCreatomateTemplate(id);
    },
    onSuccess: () => {
      toast({
        title: "Template imported successfully",
        description: "The template has been imported and is now available in your library."
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      onOpenChange(false);
      setCurlCommand("");
      setTemplateId(null);
    },
    onError: (error) => {
      toast({
        title: "Error importing template",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Handle template import
  const handleImport = () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import Template from Creatomate</DialogTitle>
          <DialogDescription>
            Paste the CURL command from Creatomate to import a template.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="curl-command">CURL Command</Label>
            <Textarea
              id="curl-command"
              placeholder="curl -X GET 'https://api.creatomate.com/v1/templates/your-template-id' -H 'Authorization: Bearer YOUR_API_KEY'"
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              className="font-mono text-sm h-32"
            />
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
