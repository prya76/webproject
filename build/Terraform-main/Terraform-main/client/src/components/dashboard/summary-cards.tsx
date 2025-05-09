import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface ResourceCount {
  total: number;
  healthy: number;
  warning: number;
  error: number;
}

interface DeploymentCount {
  active: number;
  total: number;
}

interface SummaryCardsProps {
  resourceCount: ResourceCount;
  deployments: DeploymentCount;
  deploymentPercentage: number;
}

export default function SummaryCards({ 
  resourceCount, 
  deployments,
  deploymentPercentage 
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Resource Status Summary */}
      <Card className="dashboard-card bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-4">RESOURCE STATUS</h3>
          <InfoIcon className="text-primary h-5 w-5" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold">{resourceCount.total}</p>
            <p className="text-sm text-neutral-3">Total Resources</p>
          </div>
          <div className="flex items-center">
            <div className="flex flex-col items-center mr-3">
              <span className="inline-block w-3 h-3 rounded-full bg-success mb-1"></span>
              <span className="text-sm">{resourceCount.healthy}</span>
            </div>
            <div className="flex flex-col items-center mr-3">
              <span className="inline-block w-3 h-3 rounded-full bg-warning mb-1"></span>
              <span className="text-sm">{resourceCount.warning}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-danger mb-1"></span>
              <span className="text-sm">{resourceCount.error}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Deployment Status Summary */}
      <Card className="dashboard-card bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-4">DEPLOYMENT STATUS</h3>
          <InfoIcon className="text-primary h-5 w-5" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold">{deployments.active}</p>
            <p className="text-sm text-neutral-3">Active Deployments</p>
          </div>
          <div className="w-24 h-24 flex items-center justify-center">
            {/* Simple gauge chart */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-neutral-2 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-success rounded-full" 
                style={{ 
                  clipPath: `polygon(0 0, 100% 0, 100% ${deploymentPercentage}%, 0 ${deploymentPercentage}%)` 
                }}
              ></div>
              <span className="text-lg font-medium">{deploymentPercentage}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Resource Utilization Summary */}
      <Card className="dashboard-card bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-4">RESOURCE UTILIZATION</h3>
          <InfoIcon className="text-primary h-5 w-5" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">CPU</span>
              <span className="text-sm font-medium">64%</span>
            </div>
            <div className="w-full bg-neutral-2 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Memory</span>
              <span className="text-sm font-medium">48%</span>
            </div>
            <div className="w-full bg-neutral-2 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Storage</span>
              <span className="text-sm font-medium">72%</span>
            </div>
            <div className="w-full bg-neutral-2 rounded-full h-2">
              <div className="bg-warning h-2 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Network</span>
              <span className="text-sm font-medium">23%</span>
            </div>
            <div className="w-full bg-neutral-2 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '23%' }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
