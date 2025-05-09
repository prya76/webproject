import { Resource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle, AlertTriangle, AlertCircle, MoreVertical, RefreshCw } from "lucide-react";
import { useUpdateResourceStatus } from "@/lib/infrastructure";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import useWebSocket from "@/hooks/use-websocket";
import { sendResourceUpdate } from "@/lib/infrastructure";

interface ResourceListProps {
  resources: Resource[];
}

export default function ResourceList({ resources }: ResourceListProps) {
  const updateResourceStatus = useUpdateResourceStatus();
  const { toast } = useToast();
  const { socket } = useWebSocket();
  const [refreshing, setRefreshing] = useState<number | null>(null);

  const handleUpdateStatus = (id: number, status: string) => {
    updateResourceStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({
          title: "Resource Updated",
          description: `Resource status updated to ${status}`,
        });
      },
      onError: () => {
        toast({
          title: "Update Failed",
          description: "Failed to update resource status",
          variant: "destructive"
        });
      }
    });

    // Also update via WebSocket for real-time updates
    sendResourceUpdate(socket, id, status);
  };

  const handleRefresh = (id: number) => {
    setRefreshing(id);
    setTimeout(() => {
      setRefreshing(null);
      toast({
        title: "Resource Refreshed",
        description: "Resource status has been refreshed",
      });
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-danger" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-success/10 text-success border-success';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning';
      case 'error':
        return 'bg-danger/10 text-danger border-danger';
      default:
        return 'bg-neutral-2 text-neutral-4';
    }
  };

  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <Card key={resource.id} className="shadow-sm">
          <CardContent className="p-0">
            <div 
              className={`p-4 border-l-4 ${
                resource.status === 'healthy' 
                  ? 'border-success' 
                  : resource.status === 'warning' 
                    ? 'border-warning' 
                    : 'border-danger'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(resource.status)}
                  <div className="ml-4">
                    <h3 className="font-medium text-lg">{resource.name}</h3>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="mr-2">
                        {resource.type}
                      </Badge>
                      <span className="text-sm text-neutral-3">
                        ID: {resource.details?.id || '-'}
                      </span>
                      {resource.details?.uptime && (
                        <span className="text-sm text-neutral-3 ml-4">
                          Uptime: {resource.details.uptime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className={`mr-4 ${getStatusColor(resource.status)}`}>
                    {getStatusText(resource.status)}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={refreshing === resource.id ? "animate-spin" : ""}
                    onClick={() => handleRefresh(resource.id)}
                  >
                    <RefreshCw className="h-4 w-4 text-neutral-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4 text-neutral-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(resource.id, 'healthy')}
                        className="text-success"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark as Healthy
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(resource.id, 'warning')}
                        className="text-warning"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" /> Mark as Warning
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(resource.id, 'error')}
                        className="text-danger"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" /> Mark as Error
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {(resource.details?.warning || resource.details?.error) && (
                <div className={`mt-3 p-3 rounded-md text-sm ${
                  resource.status === 'warning' 
                    ? 'bg-warning/10 text-warning' 
                    : 'bg-danger/10 text-danger'
                }`}>
                  {resource.details.warning || resource.details.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
