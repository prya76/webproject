import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResources, useDeployments } from "@/lib/infrastructure";
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

export default function ReportsPage() {
  const { data: resources } = useResources();
  const { data: deployments } = useDeployments();
  const [timeRange, setTimeRange] = useState("week");

  // Resource status distribution data for pie chart
  const resourceStatusData = [
    { name: "Healthy", value: resources?.filter(r => r.status === "healthy").length || 0, color: "#42be65" },
    { name: "Warning", value: resources?.filter(r => r.status === "warning").length || 0, color: "#f1c21b" },
    { name: "Error", value: resources?.filter(r => r.status === "error").length || 0, color: "#da1e28" }
  ];

  // Mock deployment data for timeline visualization
  // In a real app, this would come from the API with timestamp data
  const deploymentTimelineData = [
    { day: "Mon", count: 4 },
    { day: "Tue", count: 2 },
    { day: "Wed", count: 5 },
    { day: "Thu", count: 3 },
    { day: "Fri", count: 7 },
    { day: "Sat", count: 1 },
    { day: "Sun", count: 0 }
  ];

  // Resource types distribution data
  const resourceTypeData = [
    { type: "Servers", count: resources?.filter(r => r.type === "server").length || 0 },
    { type: "Databases", count: resources?.filter(r => r.type === "database").length || 0 },
    { type: "Storage", count: resources?.filter(r => r.type === "storage").length || 0 },
    { type: "Network", count: resources?.filter(r => r.type === "network").length || 0 }
  ];

  // Deployment status counts
  const deploymentStatusData = [
    { status: "Completed", count: deployments?.filter(d => d.status === "completed").length || 0 },
    { status: "In Progress", count: deployments?.filter(d => d.status === "in_progress").length || 0 },
    { status: "Failed", count: deployments?.filter(d => d.status === "failed").length || 0 },
    { status: "Pending", count: deployments?.filter(d => d.status === "pending").length || 0 }
  ];

  return (
    <>
      <Helmet>
        <title>Reports & Analytics | InfraManager</title>
        <meta name="description" content="View analytics and reports about your infrastructure deployments and resources." />
      </Helmet>
      <div className="p-6 bg-neutral-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={resourceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {resourceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={deploymentTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#0f62fe" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourceTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0f62fe" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deploymentStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0f62fe" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
