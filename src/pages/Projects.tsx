
import { MainLayout } from "@/components/Layout/MainLayout";

export default function Projects() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            View and manage your media projects
          </p>
        </div>
        
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          No projects yet. Start by creating a new project.
        </div>
      </div>
    </MainLayout>
  );
}
