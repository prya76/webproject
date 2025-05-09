import { InfraTemplate } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";

interface TemplateListProps {
  templates: InfraTemplate[];
  onSelect: (id: number) => void;
  selectedId: number | null;
}

export default function TemplateList({ templates, onSelect, selectedId }: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTemplates = searchQuery
    ? templates.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.provider.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : templates;

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Templates</CardTitle>
        <div className="mt-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-3" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="h-full overflow-auto">
        <div className="space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-6 text-neutral-3">
              No templates found
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div 
                key={template.id}
                className={`border p-3 rounded-md transition-colors cursor-pointer ${
                  selectedId === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-2 hover:border-primary'
                }`}
                onClick={() => onSelect(template.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">{template.name}</h3>
                  <Badge variant="outline">{template.provider}</Badge>
                </div>
                {template.description && (
                  <p className="text-sm text-neutral-3 mb-2 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center text-xs text-neutral-3">
                  <span>Last updated: {formatLastUpdate(template.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
