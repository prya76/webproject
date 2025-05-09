import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Settings | InfraManager</title>
        <meta name="description" content="Configure your infrastructure management platform settings and preferences." />
      </Helmet>
      <div className="p-6 bg-neutral-1">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organization-name">Organization Name</Label>
                    <Input id="organization-name" defaultValue="My Organization" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default-region">Default Region</Label>
                    <Input id="default-region" defaultValue="us-west-2" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-refresh">Auto-refresh Dashboard</Label>
                    <Switch id="auto-refresh" defaultChecked />
                  </div>
                  <p className="text-sm text-neutral-3">
                    Automatically refresh dashboard data every 30 seconds
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deployment-notifications">Deployment Notifications</Label>
                    <Switch id="deployment-notifications" defaultChecked />
                  </div>
                  <p className="text-sm text-neutral-3">
                    Receive notifications when deployments complete or fail
                  </p>
                </div>

                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">AWS Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aws-access-key">Access Key ID</Label>
                      <Input id="aws-access-key" type="password" defaultValue="•••••••••••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aws-secret-key">Secret Access Key</Label>
                      <Input id="aws-secret-key" type="password" defaultValue="•••••••••••••••••" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">GCP Credentials</h3>
                  <div className="space-y-2">
                    <Label htmlFor="gcp-json-key">Service Account JSON</Label>
                    <div className="flex items-center gap-2">
                      <Input id="gcp-json-key" type="file" className="hidden" />
                      <Button variant="outline" className="w-full justify-start" onClick={() => document.getElementById('gcp-json-key')?.click()}>
                        Select JSON Key File
                      </Button>
                      <Button variant="outline">Remove</Button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings}>Save Credentials</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="notification-email">Email Address</Label>
                      <Input id="notification-email" type="email" defaultValue="admin@example.com" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Events</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deploy-start">Deployment Started</Label>
                      <Switch id="deploy-start" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deploy-complete">Deployment Completed</Label>
                      <Switch id="deploy-complete" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deploy-fail">Deployment Failed</Label>
                      <Switch id="deploy-fail" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="resource-warning">Resource Warnings</Label>
                      <Switch id="resource-warning" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="resource-error">Resource Errors</Label>
                      <Switch id="resource-error" defaultChecked />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings}>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-primary rounded-md p-4 flex flex-col items-center">
                      <div className="w-full h-24 bg-white mb-2 rounded"></div>
                      <Label>Light</Label>
                    </div>
                    <div className="border border-neutral-3 rounded-md p-4 flex flex-col items-center">
                      <div className="w-full h-24 bg-neutral-4 mb-2 rounded"></div>
                      <Label>Dark</Label>
                    </div>
                    <div className="border border-neutral-3 rounded-md p-4 flex flex-col items-center">
                      <div className="w-full h-24 bg-gradient-to-b from-white to-neutral-4 mb-2 rounded"></div>
                      <Label>System</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dashboard Layout</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compact-view">Compact View</Label>
                      <Switch id="compact-view" />
                    </div>
                    <p className="text-sm text-neutral-3">
                      Show more information in less space
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveSettings}>Save Appearance Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Configuration</h3>
                  <div className="space-y-2">
                    <Label htmlFor="api-timeout">API Timeout (seconds)</Label>
                    <Input id="api-timeout" type="number" defaultValue="30" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Terraform Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-apply">Auto Apply on Save</Label>
                      <Switch id="auto-apply" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="parallelism">Parallelism</Label>
                      <Input id="parallelism" type="number" defaultValue="10" className="w-20" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Danger Zone</h3>
                  <div className="space-y-3">
                    <Button variant="destructive">Clear All Data</Button>
                    <Button variant="destructive">Reset to Default Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
