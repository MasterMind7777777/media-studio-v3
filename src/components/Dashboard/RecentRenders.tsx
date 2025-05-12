
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockRenderJobs, mockTemplates } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RecentRenders() {
  const recentRenderJobs = mockRenderJobs.slice(0, 3);

  const getTemplateNameById = (id: string) => {
    const template = mockTemplates.find((t) => t.id === id);
    return template?.name || "Unknown Template";
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="animate-pulse border-amber-500 text-amber-500">
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Renders</CardTitle>
        <CardDescription>Your recently created media outputs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentRenderJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-md bg-slate-100 w-12 h-12 flex items-center justify-center">
                  {job.status === "completed" ? (
                    <div className="w-12 h-12 bg-studio-200 rounded-md flex items-center justify-center">
                      <Download className="h-5 w-5 text-studio-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{getTemplateNameById(job.template_id)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {renderStatusBadge(job.status)}
                {job.status === "completed" && (
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
