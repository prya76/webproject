import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, History } from "lucide-react";
import { AnsiblePlaybook } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendAnsibleRun } from "@/lib/infrastructure";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface AnsibleConsoleProps {
  playbooks: AnsiblePlaybook[];
  socket: WebSocket | null;
  consoleOutput: string;
}

export default function AnsibleConsole({ playbooks, socket, consoleOutput }: AnsibleConsoleProps) {
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');
  const [executionMode, setExecutionMode] = useState<'cloud' | 'local'>('local');
  const consoleRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Select first playbook by default when loaded
  useEffect(() => {
    if (playbooks.length > 0 && !selectedPlaybookId) {
      setSelectedPlaybookId(playbooks[0].id.toString());
    }
  }, [playbooks, selectedPlaybookId]);

  // Auto-scroll console output to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const selectedPlaybook = playbooks.find(p => p.id.toString() === selectedPlaybookId);

  const formatLastRun = (date: Date | null) => {
    if (!date) return 'Never run';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleRunPlaybook = () => {
    if (!selectedPlaybookId) {
      toast({
        title: "No Playbook Selected",
        description: "Please select a playbook to run.",
        variant: "destructive"
      });
      return;
    }

    if (sendAnsibleRun(socket, parseInt(selectedPlaybookId), executionMode)) {
      toast({
        title: "Ansible Playbook Execution Started",
        description: `The playbook is being executed in ${executionMode} mode. Check console for updates.`,
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

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Ansible Automation</CardTitle>
          <div className="flex">
            <Button 
              variant="outline" 
              className="border-neutral-3 rounded-md text-sm flex items-center"
            >
              <History className="h-4 w-4 mr-1" /> Execution History
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <label className="text-sm font-medium mr-3">Select Playbook:</label>
              <Select 
                value={selectedPlaybookId} 
                onValueChange={setSelectedPlaybookId}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a playbook" />
                </SelectTrigger>
                <SelectContent>
                  {playbooks.map(playbook => (
                    <SelectItem key={playbook.id} value={playbook.id.toString()}>
                      {playbook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-neutral-3 mr-2">Last run:</span>
              <span className="text-sm">
                {selectedPlaybook ? formatLastRun(selectedPlaybook.lastRun) : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between mb-4 bg-neutral-1 p-3 rounded-md">
            <div className="flex items-center">
              <label className="text-sm font-medium mr-3">Execution Mode:</label>
              <Select 
                value={executionMode} 
                onValueChange={(value: 'cloud' | 'local') => setExecutionMode(value)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select execution mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Development (localhost)</SelectItem>
                  <SelectItem value="cloud">Cloud Environment (simulated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <Button 
                onClick={handleRunPlaybook}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md text-sm flex items-center"
              >
                <Play className="h-4 w-4 mr-1" /> Run Playbook
              </Button>
            </div>
          </div>
          
          <div 
            className="console-output font-mono text-sm bg-gray-900 text-white p-4 rounded-md overflow-auto h-[400px]" 
            ref={consoleRef}
            style={{ 
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
            }}
          >
            {consoleOutput ? colorizeOutput(consoleOutput) : (
              <p className="text-gray-400 italic">
                Console output will appear here when you run a playbook.
                <br/><br/>
                Using {executionMode === 'local' ? 'localhost' : 'cloud'} execution mode.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
