import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { Resource } from "@shared/schema";
import { useUpdateResourceStatus } from "@/lib/infrastructure";
import useWebSocket from "@/hooks/use-websocket";
import { sendResourceUpdate } from "@/lib/infrastructure";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ResourceStatusProps {
  resources: Resource[];
}

export default function ResourceStatus({ resources }: ResourceStatusProps) {
  const { socket } = useWebSocket();
  const updateResourceStatus = useUpdateResourceStatus();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 mr-1 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 mr-1 text-warning" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-1 text-danger" />;
      default:
        return <CheckCircle className="h-4 w-4 mr-1 text-success" />;
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
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-danger';
      default:
        return 'text-neutral-4';
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Resource Status</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={isRefreshing ? "animate-spin" : ""}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {resources.map((resource) => (
            <div 
              key={resource.id}
              className={`p-3 rounded-md ${
                resource.status === 'healthy' 
                  ? 'resource-status-healthy' 
                  : resource.status === 'warning' 
                    ? 'resource-status-warning' 
                    : 'resource-status-error'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{resource.name}</span>
                <span className={`flex items-center text-sm ${getStatusColor(resource.status)}`}>
                  {getStatusIcon(resource.status)}
                  {getStatusText(resource.status)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-3">
                  ID: {resource.details?.id || '-'}
                </span>
                <span className="text-neutral-3">
                  {resource.details?.uptime ? `Uptime: ${resource.details.uptime}` : 
                   resource.details?.state ? `State: ${resource.details.state}` : ''}
                </span>
              </div>
              {(resource.details?.warning || resource.details?.error) && (
                <div className={`text-xs mt-1 ${
                  resource.status === 'warning' ? 'text-warning' : 'text-danger'
                }`}>
                  {resource.details.warning || resource.details.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
