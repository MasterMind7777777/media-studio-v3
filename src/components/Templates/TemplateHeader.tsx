
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface TemplateHeaderProps {
  templateName: string;
  onBack: () => void;
}

export function TemplateHeader({ templateName, onBack }: TemplateHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <Button variant="ghost" className="gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <h1 className="text-xl font-bold">{templateName}</h1>
      <div className="w-24"></div> {/* Empty div for spacing */}
    </div>
  );
}
