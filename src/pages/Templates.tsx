
import { MainLayout } from "@/components/Layout/MainLayout";
import { mockTemplates } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Filter } from "lucide-react";

export default function Templates() {
  const navigate = useNavigate();
  const templates = mockTemplates;
  
  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <MainLayout>
      <div className="flex flex-col gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Choose from our collection of professionally designed templates
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          
          {categories.map(category => (
            <Button key={category} variant="outline">
              {category}
            </Button>
          ))}
          
          <div className="ml-auto flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            Recently added
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={template.preview_image_url}
                  alt={template.name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.platforms.map((platform) => (
                    <div key={platform.id} className="text-xs px-2 py-1 bg-muted rounded-md">
                      {platform.name}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => window.open(template.preview_image_url, '_blank')}
                >
                  Preview
                </Button>
                <Button 
                  variant="default"
                  className="bg-studio-600 hover:bg-studio-700"
                  onClick={() => navigate(`/create?template=${template.id}`)}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
