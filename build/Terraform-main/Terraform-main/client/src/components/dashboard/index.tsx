import SummaryCards from "./summary-cards";
import InfraVisualization from "./infra-visualization";
import ResourceStatus from "./resource-status";
import TemplateLibrary from "./template-library";
import TerraformEditor from "../terraform/terraform-editor";
import AnsibleConsole from "../ansible/ansible-console";
import { useResources, useTerraformConfigs, useAnsiblePlaybooks, useDeployments, useInfraTemplates } from "@/lib/infrastructure";
import useWebSocket from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: resources, isLoading: isLoadingResources } = useResources();
  const { data: terraformConfigs, isLoading: isLoadingTerraform } = useTerraformConfigs();
  const { data: ansiblePlaybooks, isLoading: isLoadingAnsible } = useAnsiblePlaybooks();
  const { data: deployments, isLoading: isLoadingDeployments } = useDeployments();
  const { data: templates, isLoading: isLoadingTemplates } = useInfraTemplates();
  
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  
  const { status: wsStatus, data: wsData, socket } = useWebSocket({
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'terraform_output' || data.type === 'ansible_output') {
          setConsoleOutput(prev => prev + data.message + '\n');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });

  // Handle WebSocket data updates
  useEffect(() => {
    if (wsData) {
      // When receiving initial data from the server
      if (wsData.type === 'initial_data') {
        // Data will be updated via the React Query cache
        console.log('Received initial data from WebSocket');
      }
    }
  }, [wsData]);

  // Calculate summary data
  const summaryData = {
    resources: {
      total: resources?.length || 0,
      healthy: resources?.filter(r => r.status === 'healthy').length || 0,
      warning: resources?.filter(r => r.status === 'warning').length || 0,
      error: resources?.filter(r => r.status === 'error').length || 0
    },
    deployments: {
      active: deployments?.filter(d => d.status === 'in_progress').length || 0,
      total: deployments?.length || 0
    }
  };

  // Calculate progress percentage
  const activeDeployments = deployments?.filter(d => d.status === 'in_progress').length || 0;
  const totalDeployments = deployments?.length || 0;
  const deploymentPercentage = totalDeployments > 0 
    ? Math.round((1 - activeDeployments / totalDeployments) * 100) 
    : 0;

  const isLoading = isLoadingResources || isLoadingTerraform || isLoadingAnsible || isLoadingDeployments || isLoadingTemplates;

  return (
    <div className="p-6 bg-neutral-1">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <SummaryCards 
            resourceCount={summaryData.resources} 
            deployments={summaryData.deployments}
            deploymentPercentage={deploymentPercentage}
          />
          
          <InfraVisualization resources={resources || []} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TerraformEditor 
                config={terraformConfigs?.[0] || null} 
                socket={socket}
              />
              
              <div className="mt-6">
                <AnsibleConsole 
                  playbooks={ansiblePlaybooks || []} 
                  socket={socket} 
                  consoleOutput={consoleOutput}
                />
              </div>
            </div>
            
            <div>
              <ResourceStatus resources={resources || []} />
              
              <div className="mt-6">
                <TemplateLibrary templates={templates || []} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      
      {/* Visualization Skeleton */}
      <Skeleton className="h-96 rounded-lg mb-6" />
      
      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-80 rounded-lg mb-6" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-60 rounded-lg mb-6" />
          <Skeleton className="h-60 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
