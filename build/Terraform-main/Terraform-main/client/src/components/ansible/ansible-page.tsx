import { useState, useEffect, useRef } from "react";
import { useAnsiblePlaybooks, useCreateAnsiblePlaybook } from "@/lib/infrastructure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useWebSocket from "@/hooks/use-websocket";
import { sendAnsibleRun } from "@/lib/infrastructure";
import { Play, Plus, History, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

const defaultPlaybookTemplate = `---
- name: Sample Playbook
  hosts: all
  become: yes
  tasks:
    - name: Ensure required packages are installed
      apt:
        name: 
          - nginx
          - curl
          - vim
        state: present
        update_cache: yes
        
    - name: Ensure nginx is started and enabled
      service:
        name: nginx
        state: started
        enabled: yes`;

const createPlaybookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Playbook content is required")
});

export default function AnsiblePage() {
  const { data: playbooks, isLoading } = useAnsiblePlaybooks();
  const createPlaybook = useCreateAnsiblePlaybook();
  const { toast } = useToast();
  const [activePlaybookId, setActivePlaybookId] = useState<number | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);
  
  const { status: wsStatus, data: wsData, socket } = useWebSocket({
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ansible_output') {
          setConsoleOutput(prev => prev + data.message + '\n');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });

  const form = useForm<z.infer<typeof createPlaybookSchema>>({
    resolver: zodResolver(createPlaybookSchema),
    defaultValues: {
      name: "",
      content: defaultPlaybookTemplate
    }
  });

  // Auto-scroll console output to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Set initial active playbook when data loads
  if (playbooks && playbooks.length > 0 && activePlaybookId === null) {
    setActivePlaybookId(playbooks[0].id);
  }

  const activePlaybook = playbooks?.find(playbook => playbook.id === activePlaybookId);

  const onSubmit = (values: z.infer<typeof createPlaybookSchema>) => {
    createPlaybook.mutate({
      name: values.name,
      content: values.content
    }, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        toast({
          title: "Playbook Created",
          description: "Ansible playbook has been created successfully.",
        });
        form.reset({
          name: "",
          content: defaultPlaybookTemplate
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to create Ansible playbook.",
          variant: "destructive"
        });
      }
    });
  };

  const handleRunPlaybook = () => {
    if (!activePlaybookId) return;
    
    setConsoleOutput(""); // Clear previous output
    
    if (sendAnsibleRun(socket, activePlaybookId)) {
      toast({
        title: "Ansible Playbook Execution Started",
        description: "The playbook is being executed. Check console for updates.",
      });
    } else {
      toast({
        title: "Connection Issue",
        description: "Couldn't connect to the server. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Parse console output to add colors
  const colorizeOutput = (output: string) => {
    if (!output) return [];
    
    return output.split('\n').map((line, index) => {
      if (line.includes('PLAY [')) {
        return <p key={index} className="text-green-500">{line}</p>;
      } else if (line.includes('TASK [')) {
        return <p key={index} className="text-neutral-2">{line}</p>;
      } else if (line.includes('ok:')) {
        return <p key={index} className="text-white">{line}</p>;
      } else if (line.includes('changed:')) {
        return <p key={index} className="text-yellow-500">{line}</p>;
      } else if (line.includes('PLAY RECAP')) {
        return <p key={index} className="text-green-500">{line}</p>;
      } else if (line.includes('failed:') || line.includes('FAILED!')) {
        return <p key={index} className="text-red-500">{line}</p>;
      } else if (line.trim() === '') {
        return <p key={index}>&nbsp;</p>;
      } else {
        return <p key={index} className="text-white">{line}</p>;
      }
    });
  };

  const formatLastRun = (date: Date | null) => {
    if (!date) return 'Never run';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="p-6 bg-neutral-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Ansible Automation</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="mr-2">
            <History className="h-4 w-4 mr-2" /> Execution History
          </Button>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white">
                <Plus className="h-4 w-4 mr-2" /> New Playbook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Create Ansible Playbook</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Playbook Name</FormLabel>
                        <FormControl>
                          <Input placeholder="web-server-setup.yml" {...field} />
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
                        <FormLabel>Playbook Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ansible playbook YAML..." 
                            className="font-mono h-64"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createPlaybook.isPending}>
                    {createPlaybook.isPending ? "Creating..." : "Create Playbook"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <>
          {playbooks && playbooks.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>Playbook Configuration</CardTitle>
                    <Button
                      onClick={handleRunPlaybook}
                      className="bg-primary text-white"
                      disabled={!activePlaybookId}
                    >
                      <Play className="h-4 w-4 mr-2" /> Run Playbook
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs 
                    value={activePlaybookId?.toString() || ""} 
                    onValueChange={(value) => setActivePlaybookId(Number(value))}
                  >
                    <div className="p-4">
                      <TabsList>
                        {playbooks.map(playbook => (
                          <TabsTrigger key={playbook.id} value={playbook.id.toString()}>
                            {playbook.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    
                    {playbooks.map(playbook => (
                      <TabsContent key={playbook.id} value={playbook.id.toString()}>
                        <div className="flex justify-between px-4 pb-2 text-sm text-neutral-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Last run: {formatLastRun(playbook.lastRun)}</span>
                          </div>
                        </div>
                        <div className="relative font-mono text-sm">
                          <pre className="w-full h-full p-4 font-mono text-sm bg-[#161616] text-white min-h-[300px] rounded-b-md overflow-x-auto">
                            <code>{playbook.content}</code>
                          </pre>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Execution Console</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="console-output font-mono text-sm" ref={consoleRef}>
                    {consoleOutput ? (
                      colorizeOutput(consoleOutput)
                    ) : (
                      <div className="p-4 text-neutral-3">
                        Click "Run Playbook" to execute the Ansible playbook
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
                  <h3 className="text-xl font-medium mb-2">No Ansible Playbooks</h3>
                  <p className="text-neutral-3">
                    Create your first Ansible playbook to get started
                  </p>
                </div>
                <Button 
                  onClick={() => setOpenCreateDialog(true)}
                  className="bg-primary text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Playbook
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
