
import { memo } from "react";
import { Template, Platform } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TemplateCardProps {
  template: Template;
  onSelect: (id: string) => void;
}

// Using memo to prevent unnecessary re-renders when other templates change
const TemplateCard = memo(({ template, onSelect }: TemplateCardProps) => {
  return (
    <Card key={template.id} className="overflow-hidden cursor-pointer hover-scale">
      <div 
        className="group relative"
        onClick={() => onSelect(template.id)}
      >
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={template.preview_image_url || "/placeholder.svg"}
            alt={template.name}
            className="w-full h-full object-cover"
            loading="lazy" // Add lazy loading for performance
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          <h3 className="text-white font-medium">{template.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {template.platforms.slice(0, 2).map((platform: Platform, index: number) => (
              <span key={index} className="text-xs text-white/80 bg-white/20 px-1.5 py-0.5 rounded">
                {platform.aspect_ratio}
              </span>
            ))}
            {template.platforms.length > 2 && (
              <span className="text-xs text-white/80 bg-white/20 px-1.5 py-0.5 rounded">
                +{template.platforms.length - 2}
              </span>
            )}
          </div>
          <div className="mt-2">
            <Button 
              className="w-full bg-white text-gray-800 hover:bg-gray-200"
              size="sm"
            >
              Select Template
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

TemplateCard.displayName = "TemplateCard";

export default TemplateCard;
