
import { RenderJob, Template } from "@/types";

/**
 * Returns a user-friendly name for a project based on render job and optional template data
 */
export function getProjectName(
  project: RenderJob, 
  template?: Template | null
): string {
  // If project has a name, use it
  if (project.name && project.name.trim() !== "") {
    return project.name;
  }
  
  // If we have template data, use the template name
  if (template?.name) {
    return `${template.name} (${project.id.substring(0, 8)})`;
  }
  
  // Default to project ID
  return `Project ${project.id.substring(0, 8)}`;
}
