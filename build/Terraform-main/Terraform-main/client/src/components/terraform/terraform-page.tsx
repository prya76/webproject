import { useState, useRef, useEffect } from "react";
import { useTerraformConfigs, useCreateTerraformConfig } from "@/lib/infrastructure";
import { CodeEditorWithVariables } from "@/components/ui/code-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { sendTerraformApply } from "@/lib/infrastructure";
import useWebSocket from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultTerraformTemplate = `provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = {
    Name = "main-vpc"
    Environment = var.environment
  }
}`;

const defaultVariables = {
  aws_region: "us-west-2",
  environment: "development",
  vpc_cidr: "10.0.0.0/16"
};

const createConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Configuration content is required"),
  variables: z.any()
});

export default function TerraformPage() {
  const { data: terraformConfigs, isLoading } = useTerraformConfigs();
  const createConfig = useCreateTerraformConfig();
  const { toast } = useToast();
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [executionMode, setExecutionMode] = useState<'cloud' | 'local'>('local');
  const consoleRef = useRef<HTMLDivElement>(null);
  
  const { status: wsStatus, data: wsData, socket } = useWebSocket({
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'terraform_output') {
          setConsoleOutput(prev => prev + data.message + '\n');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });
  
  // Auto-scroll console output to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const form = useForm<z.infer<typeof createConfigSchema>>({
    resolver: zodResolver(createConfigSchema),
    defaultValues: {
      name: "",
      content: defaultTerraformTemplate,
      variables: defaultVariables
    }
  });

  const onSubmit = (values: z.infer<typeof createConfigSchema>) => {
    createConfig.mutate({
      name: values.name,
      content: values.content,
      variables: values.variables
    }, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        toast({
          title: "Configuration Created",
          description: "Terraform configuration has been created successfully.",
        });
        form.reset({
          name: "",
          content: defaultTerraformTemplate,
          variables: defaultVariables
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to create Terraform configuration.",
          variant: "destructive"
        });
      }
    });
  };

  // Set initial active config when data loads
  if (terraformConfigs && terraformConfigs.length > 0 && activeConfigId === null) {
    setActiveConfigId(terraformConfigs[0].id);
  }

  const activeConfig = terraformConfigs?.find(config => config.id === activeConfigId);

  const handleApply = () => {
    if (!activeConfigId) return;
    
    setConsoleOutput(""); // Clear previous output
    
    if (sendTerraformApply(socket, activeConfigId, executionMode)) {
      toast({
        title: "Terraform Apply Started",
        description: `The configuration is being applied in ${executionMode} mode. Check console for updates.`,
      });
    } else {
      toast({
        title: "Connection Issue",
        description: "Couldn't connect to the server. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 bg-neutral-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Terraform Configurations</h1>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <Plus className="h-4 w-4 mr-2" /> New Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Create Terraform Configuration</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration Name</FormLabel>
                      <FormControl>
                        <Input placeholder="main.tf" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Terraform configuration..." 
                          className="font-mono h-64"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createConfig.isPending}>
                  {createConfig.isPending ? "Creating..." : "Create Configuration"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      ) : (
        <>
          {terraformConfigs && terraformConfigs.length > 0 ? (
            <div className="space-y-6">
              <Tabs 
                value={activeConfigId?.toString() || ""} 
                onValueChange={(value) => setActiveConfigId(Number(value))}
              >
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    {terraformConfigs.map(config => (
                      <TabsTrigger key={config.id} value={config.id.toString()}>
                        {config.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium">Execution Mode:</label>
                    <Select
                      value={executionMode}
                      onValueChange={(value: 'cloud' | 'local') => setExecutionMode(value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select execution mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Development (localhost)</SelectItem>
                        <SelectItem value="cloud">Cloud Environment (simulated)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {terraformConfigs.map(config => (
                  <TabsContent key={config.id} value={config.id.toString()}>
                    <CodeEditorWithVariables
                      title={config.name}
                      code={config.content}
                      variables={config.variables}
                      language="hcl"
                      onApply={handleApply}
                    />
                  </TabsContent>
                ))}
              </Tabs>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Execution Console</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div 
                    ref={consoleRef}
                    className="console-output font-mono text-sm bg-gray-900 p-4 overflow-auto h-[400px]" 
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {consoleOutput ? (
                      consoleOutput.split('\n').map((line, i) => {
                        // Add color coding based on the content
                        let className = "text-white";
                        if (line.includes("Creating") || line.includes("created")) {
                          className = "text-green-500";
                        } else if (line.includes("Destroying") || line.includes("destroyed")) {
                          className = "text-red-500";
                        } else if (line.includes("Modifying") || line.includes("modified") || line.includes("Plan:")) {
                          className = "text-yellow-500";
                        } else if (line.includes("Apply complete")) {
                          className = "text-blue-500 font-bold";
                        }
                        
                        return <div key={i} className={className}>{line}</div>
                      })
                    ) : (
                      <div className="text-gray-400 italic">
                        Console output will appear here when you execute Terraform.
                        <br/><br/>
                        Using {activeConfig?.name || 'terraform'} configuration in {executionMode} mode.
                        <br/>
                        {executionMode === 'local' 
                          ? "Local execution will run Terraform commands directly on the server." 
                          : "Cloud execution will simulate running Terraform in a cloud environment."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-medium mb-2">No Terraform Configurations</h3>
                  <p className="text-neutral-3">
                    Create your first Terraform configuration to get started
                  </p>
                </div>
                <Button 
                  onClick={() => setOpenCreateDialog(true)}
                  className="bg-primary text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Configuration
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
