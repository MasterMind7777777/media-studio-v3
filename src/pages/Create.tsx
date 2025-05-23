
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTemplates } from "@/hooks/api";
import { Platform } from "@/types";
import { toast } from "@/components/ui/sonner";
import TemplateCard from "@/components/Templates/TemplateCard";

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string | "all">("all");
  
  // Fetch templates using our API hook
  const { data: templates, isLoading, error } = useTemplates();
  
  // Memoize categories to prevent recalculation on every render
  const categories = useMemo(() => {
    if (!templates) return [];
    return Array.from(new Set(templates.filter(t => t.category).map(t => t.category)));
  }, [templates]);
  
  // Memoize aspect ratios to prevent recalculation on every render
  const aspectRatios = useMemo(() => {
    if (!templates) return [];
    const ratios = Array.from(
      new Set(
        templates.flatMap(t => 
          t.platforms.map((p: Platform) => p.aspect_ratio)
        )
      )
    ).sort();
    return ratios;
  }, [templates]);

  // Get selected template from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const templateId = searchParams.get("template");
    
    if (templateId && templates) {
      console.log(`Looking for template with ID ${templateId} in ${templates.length} templates`);
      const template = templates.find(t => t.id === templateId);
      
      if (template) {
        console.log(`Found template "${template.name}", navigating to customize page`);
        navigate(`/create/${templateId}/customize`);
      } else {
        console.error(`Template with ID ${templateId} not found`);
        toast.error("Template not found", {
          description: `The template with ID ${templateId} could not be found.`
        });
      }
    }
  }, [location, navigate, templates]);

  // Memoize filtered templates for better performance
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    return templates.filter(template => {
      const matchesSearch = 
        !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      
      const matchesAspectRatio = selectedAspectRatio === "all" || 
                                template.platforms.some(p => p.aspect_ratio === selectedAspectRatio);
      
      return matchesSearch && matchesCategory && matchesAspectRatio;
    });
  }, [templates, searchTerm, selectedCategory, selectedAspectRatio]);

  // Template selection handler using useCallback to prevent recreation on every render
  const handleTemplateSelect = useCallback((templateId: string) => {
    console.log(`Template selected with ID: ${templateId}`);
    if (templates?.find(t => t.id === templateId)) {
      navigate(`/create/${templateId}/customize`);
    } else {
      toast.error("Template not found", {
        description: `The template with ID ${templateId} could not be found.`
      });
    }
  }, [templates, navigate]);

  // Show error toast if templates fail to load
  useEffect(() => {
    if (error) {
      toast.error("Failed to load templates", {
        description: (error as Error).message
      });
    }
  }, [error]);

  return (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onSelect={handleTemplateSelect} 
                  />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.slice(0, 4).map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onSelect={handleTemplateSelect}
                  />
                ))}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
