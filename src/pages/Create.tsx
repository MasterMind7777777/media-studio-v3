
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTemplates } from "@/hooks/api";
import { Platform } from "@/types";
import { toast } from "@/components/ui/sonner";

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string | "all">("all");
  
  // Fetch templates using our API hook instead of mock data
  const { data: templates, isLoading, error } = useTemplates();
  
  // Get unique categories from actual templates
  const categories = templates 
    ? Array.from(new Set(templates.filter(t => t.category).map(t => t.category)))
    : [];
  
  // Get unique aspect ratios from actual templates
  const aspectRatios = templates
    ? Array.from(
        new Set(
          templates.flatMap(t => 
            t.platforms.map((p: Platform) => p.aspect_ratio)
          )
        )
      ).sort()
    : [];

  // Get selected template from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const templateId = searchParams.get("template");
    if (templateId) {
      const template = templates?.find(t => t.id === templateId);
      if (template) {
        navigate(`/create/${templateId}/customize`);
      }
    }
  }, [location, navigate, templates]);

  // Filter templates based on search, category, and aspect ratio
  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    const matchesAspectRatio = selectedAspectRatio === "all" || 
                              template.platforms.some(p => p.aspect_ratio === selectedAspectRatio);
    
    return matchesSearch && matchesCategory && matchesAspectRatio;
  });

  const handleTemplateSelect = (templateId: string) => {
    navigate(`/create/${templateId}/customize`);
  };

  // Show error toast if templates fail to load
  useEffect(() => {
    if (error) {
      toast.error("Failed to load templates", {
        description: (error as Error).message
      });
    }
  }, [error]);

  return (
    <MainLayout>
      <div className="flex flex-col gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Start by selecting a template for your project
          </p>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                className="px-3 py-2 rounded-md border border-input focus:outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                className="px-3 py-2 rounded-md border border-input focus:outline-none"
                value={selectedAspectRatio}
                onChange={(e) => setSelectedAspectRatio(e.target.value)}
              >
                <option value="all">All Aspect Ratios</option>
                {aspectRatios.map(ratio => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="recent">Recently Used</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
                  <h3 className="font-medium text-xl text-red-500">Error Loading Templates</h3>
                  <p className="text-muted-foreground mt-2">
                    {(error as Error).message}
                  </p>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : filteredTemplates && filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden cursor-pointer hover-scale">
                      <div 
                        className="group relative"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={template.preview_image_url || "/placeholder.svg"}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          <h3 className="text-white font-medium">{template.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.platforms.slice(0, 2).map((platform, index) => (
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
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
                  <h3 className="font-medium text-xl">No templates found</h3>
                  <p className="text-muted-foreground mt-2">
                    {selectedCategory !== "all" || selectedAspectRatio !== "all" || searchTerm
                      ? "Try adjusting your filters or search terms."
                      : "No templates have been added yet."}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">No recently used templates</p>
              </div>
            </TabsContent>

            <TabsContent value="popular">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : templates ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {templates.slice(0, 4).map((template) => (
                    <Card key={template.id} className="overflow-hidden cursor-pointer hover-scale">
                      <div 
                        className="group relative"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={template.preview_image_url || "/placeholder.svg"}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          <h3 className="text-white font-medium">{template.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.platforms.slice(0, 2).map((platform, index) => (
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
                  ))}
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
