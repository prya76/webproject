import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Maximize } from 'lucide-react';
import { Resource } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InfraVisualizationProps {
  resources: Resource[];
}

export default function InfraVisualization({ resources }: InfraVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const webServers = resources.filter(r => r.type === 'server' && r.name.includes('Web Server'));
  const database = resources.find(r => r.type === 'database');

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Infrastructure Visualization</CardTitle>
          <div className="flex">
            <Button className="px-3 py-1 bg-primary text-white rounded-md text-sm flex items-center mr-2">
              <Plus className="h-4 w-4 mr-1" /> Add Resource
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="p-1 rounded hover:bg-neutral-1">
                  <Maximize className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Infrastructure Visualization</DialogTitle>
                  <DialogDescription>
                    Detailed view of your infrastructure components
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                  <NetworkDiagram resources={resources} expanded={true} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 overflow-x-auto">
        <div className="flex justify-center">
          <NetworkDiagram resources={resources} expanded={false} />
        </div>
      </CardContent>
    </Card>
  );
}

interface NetworkDiagramProps {
  resources: Resource[];
  expanded: boolean;
}

function NetworkDiagram({ resources, expanded }: NetworkDiagramProps) {
  const webServers = resources.filter(r => r.type === 'server' && r.name.includes('Web Server'));
  const database = resources.find(r => r.type === 'database');

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'healthy': return 'resource-status-healthy';
      case 'warning': return 'resource-status-warning';
      case 'error': return 'resource-status-error';
      default: return '';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-danger';
      default: return 'text-neutral-4';
    }
  };

  return (
    <div className={`bg-neutral-1 p-6 rounded-lg ${expanded ? 'w-full h-[600px]' : 'min-w-[700px] h-[350px]'}`}>
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center">
          {/* Internet Gateway */}
          <div className="bg-white p-2 rounded border border-neutral-3 shadow-sm mb-4 flex items-center">
            <span className="text-neutral-4 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </span>
            <span>Internet Gateway</span>
          </div>
          
          {/* Connection line */}
          <div className="h-8 w-0.5 bg-neutral-3"></div>
          
          {/* Load Balancer */}
          <div className="bg-white p-2 rounded border border-neutral-3 shadow-sm mb-4 flex items-center">
            <span className="text-primary mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                <path d="M12 12v9"></path>
                <path d="m8 17 4 4 4-4"></path>
              </svg>
            </span>
            <span>Load Balancer</span>
          </div>
          
          {/* Connection lines to multiple servers */}
          <div className="flex items-center justify-center">
            <div className="h-8 w-0.5 bg-neutral-3 transform -rotate-45 origin-top"></div>
            <div className="h-8 w-0.5 bg-neutral-3 mx-8"></div>
            <div className="h-8 w-0.5 bg-neutral-3 transform rotate-45 origin-top"></div>
          </div>
          
          {/* Servers */}
          <div className="flex space-x-8">
            {webServers.map((server, index) => (
              <div 
                key={server.id} 
                className={`bg-white p-2 rounded border shadow-sm flex items-center ${getStatusClass(server.status)}`}
              >
                <span className={`mr-2 ${getStatusIcon(server.status)}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                </span>
                <span>{server.name}</span>
              </div>
            ))}
          </div>
          
          {/* Connection to database */}
          {database && (
            <>
              <div className="h-8 w-0.5 bg-neutral-3 mt-4"></div>
              
              {/* Database */}
              <div 
                className={`bg-white p-2 rounded border shadow-sm flex items-center ${getStatusClass(database.status)}`}
              >
                <span className={`mr-2 ${getStatusIcon(database.status)}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  </svg>
                </span>
                <span>{database.name}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
