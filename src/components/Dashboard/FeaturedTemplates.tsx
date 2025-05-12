
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockTemplates } from "@/data/mockData";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function FeaturedTemplates() {
  const navigate = useNavigate();
  const featuredTemplates = mockTemplates.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Featured Templates</CardTitle>
          <CardDescription>
            Start creating with these popular templates
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/templates")}>
          View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredTemplates.map((template) => (
            <div key={template.id} className="overflow-hidden rounded-md hover-scale">
              <div
                className="group cursor-pointer"
                onClick={() => navigate(`/create?template=${template.id}`)}
              >
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <img
                    src={template.preview_image_url}
                    alt={template.name}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-2 text-white">
                      <p className="font-medium text-sm">{template.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
