
import { MainLayout } from "@/components/Layout/MainLayout";

export default function Activity() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Activity</h1>
          <p className="text-muted-foreground">
            View your recent activity and render history
          </p>
        </div>
        
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          No activity yet. Start by creating a new project.
        </div>
      </div>
    </MainLayout>
  );
}
