
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, ToggleRight } from "lucide-react";
import { useTemplates, useUpdateTemplate, useDeleteTemplate } from "@/hooks/api";
import { Template } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TemplateImportDialog } from "@/components/Admin/TemplateImportDialog";

export default function AdminTemplates() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Use our API hook to fetch all templates (including inactive)
  const { data: templates, isLoading, error } = useTemplates();
  
  // Mutations for updating and deleting templates
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  
  // Filter templates based on search term and category
  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = searchTerm === "" || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = !filterCategory || template.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Extract unique categories for filtering
  const categories = templates 
    ? Array.from(new Set(templates.filter(t => t.category).map(t => t.category))) 
    : [];
  
  // Handle toggle active status
  const handleToggleActive = (template: Template) => {
    updateTemplate.mutate({
      id: template.id,
      is_active: !template.is_active
    }, {
      onSuccess: () => {
        toast({
          title: `Template ${template.is_active ? "deactivated" : "activated"}`,
          description: `"${template.name}" has been ${template.is_active ? "deactivated" : "activated"}.`
        });
      },
      onError: (error) => {
        toast({
          title: "Error updating template",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };
  
  // Handle delete template
  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    
    deleteTemplate.mutate(templateToDelete.id, {
      onSuccess: () => {
        toast({
          title: "Template deleted",
          description: `"${templateToDelete.name}" has been deleted.`
        });
        setTemplateToDelete(null);
      },
      onError: (error) => {
        toast({
          title: "Error deleting template",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  // Filter toggle
  const handleCategoryClick = (category: string) => {
    setFilterCategory(filterCategory === category ? null : category);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Template Management</h1>
            <p className="text-muted-foreground">
              Create, edit and manage templates.
            </p>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="mb-4 text-red-500">Error loading templates</div>
          <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template Management</h1>
          <p className="text-muted-foreground">
            Create, edit and manage templates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Import Template
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setFilterCategory(null)}
            disabled={!filterCategory}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Clear Filter</span>
          </Button>
        </div>
        
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button 
                key={category} 
                variant={filterCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Platforms</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    Loading templates...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-xs">{template.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{template.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{template.category || "—"}</TableCell>
                  <TableCell className="text-center">
                    {template.platforms && template.platforms.length > 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                        {template.platforms.map(p => p.name).join(", ")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer"
                          onClick={() => {
                            // View template details (to be implemented)
                            toast({
                              title: "View template",
                              description: "This feature will be implemented soon."
                            });
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer"
                          onClick={() => {
                            // Edit template (to be implemented)
                            toast({
                              title: "Edit template",
                              description: "This feature will be implemented soon."
                            });
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer"
                          onClick={() => handleToggleActive(template)}
                        >
                          <ToggleRight className="mr-2 h-4 w-4" />
                          {template.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => setTemplateToDelete(template)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm || filterCategory ? (
                    <div className="text-muted-foreground">No templates match your search criteria.</div>
                  ) : (
                    <div className="text-muted-foreground">No templates found. Import some templates to get started.</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template "{templateToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Template Import Dialog */}
      <TemplateImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );
}
