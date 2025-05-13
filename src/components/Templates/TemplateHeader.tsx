
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Template } from "@/types";
import { ReactNode } from "react";

interface TemplateHeaderProps {
  templateName?: string;
  onBack?: () => void;
  template?: Template;
  actions?: ReactNode;
}

export function TemplateHeader({ templateName, onBack, template, actions }: TemplateHeaderProps) {
  // Determine the name to display - either from direct prop or from template object
  const displayName = templateName || (template ? template.name : "Template");
  
  // Default onBack handler that goes back in history
  const handleBack = onBack || (() => window.history.back());
  
  return (
    <div className="flex items-center justify-between mb-2">
      <Button variant="ghost" className="gap-2" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <h1 className="text-xl font-bold">{displayName}</h1>
      <div className="w-24 flex justify-end">
        {actions}
      </div>
    </div>
  );
}
