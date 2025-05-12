
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Template, Platform } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Filter, Loader2 } from "lucide-react";
import { useTemplates } from "@/hooks/api";

export default function Templates() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch templates using our custom hook
  const { data: templates, isLoading, error } = useTemplates();
  
  // Get unique categories from templates
  const categories = templates 
    ? Array.from(new Set(templates.filter(t => t.category).map(t => t.category))) as string[]
    : [];
  
  // Filter templates by selected category
  const filteredTemplates = selectedCategory && templates
    ? templates.filter(t => t.category === selectedCategory)
    : templates;
    
  // Handle category selection
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] p-8">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Templates</h2>
          <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </MainLayout>
    );
  }

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
            <Button 
              key={category} 
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Button>
          ))}
          
          <div className="ml-auto flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            Recently added
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates?.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={template.preview_image_url || "/placeholder.svg"}
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
                    {Array.isArray(template.platforms) && template.platforms.map((platform, index) => (
                      <div key={index} className="text-xs px-2 py-1 bg-muted rounded-md">
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
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
            <h3 className="font-medium text-xl">No templates found</h3>
            <p className="text-muted-foreground mt-2">
              {selectedCategory 
                ? `No templates found in the "${selectedCategory}" category.` 
                : "No templates have been added yet."}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
