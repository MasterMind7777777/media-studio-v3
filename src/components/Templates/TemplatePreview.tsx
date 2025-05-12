
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TemplatePreviewProps {
  previewImageUrl: string;
  width?: number;
  height?: number;
}

export function TemplatePreview({ previewImageUrl, width, height }: TemplatePreviewProps) {
  return (
    <Card className="h-full">
      <div className="aspect-video bg-black/80 rounded-t-md flex items-center justify-center">
        <div className="text-white text-center p-8">
          <div className="text-xl font-medium mb-4">Preview</div>
          <p className="text-white/70 mb-4">
            Creatomate Preview SDK would be integrated here
          </p>
          <img 
            src={previewImageUrl} 
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
          {width} × {height}
        </div>
      </div>
    </Card>
  );
}
