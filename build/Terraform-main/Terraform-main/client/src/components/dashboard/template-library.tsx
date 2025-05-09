import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import { InfraTemplate } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TemplateLibraryProps {
  templates: InfraTemplate[];
}

export default function TemplateLibrary({ templates }: TemplateLibraryProps) {
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Infrastructure Templates</CardTitle>
          <Button 
            variant="outline" 
            className="px-3 py-1 border-primary text-primary rounded-md text-sm flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" /> New Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {templates.map((template) => (
            <div 
              key={template.id}
              className="border border-neutral-2 p-3 rounded-md hover:border-primary cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{template.name}</span>
                <span className="text-xs bg-neutral-1 text-neutral-4 px-2 py-0.5 rounded-full">
                  {template.provider}
                </span>
              </div>
              <p className="text-sm text-neutral-3 mb-2">
                {template.description}
              </p>
              <div className="flex items-center text-sm">
                <Clock className="text-neutral-3 h-3 w-3 mr-1" />
                <span className="text-neutral-3">
                  Last updated: {formatLastUpdate(template.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
