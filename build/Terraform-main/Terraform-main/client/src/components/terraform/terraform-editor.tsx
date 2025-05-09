import { useState } from "react";
import { CodeEditorWithVariables } from "@/components/ui/code-editor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TerraformConfig } from "@shared/schema";
import { useUpdateTerraformConfig } from "@/lib/infrastructure";
import { sendTerraformApply } from "@/lib/infrastructure";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface TerraformEditorProps {
  config: TerraformConfig | null;
  socket: WebSocket | null;
}

export default function TerraformEditor({ config, socket }: TerraformEditorProps) {
  const [code, setCode] = useState(config?.content || '');
  const [variables, setVariables] = useState(config?.variables || {});
  const [executionMode, setExecutionMode] = useState<'cloud' | 'local'>('local');
  const updateConfig = useUpdateTerraformConfig();
  const { toast } = useToast();

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleVariableChange = (name: string, value: string) => {
    try {
      let parsedValue = value;
      
      // Try to parse arrays and objects
      if (value.includes('\n')) {
        // Treat as array if it contains newlines
        parsedValue = value.split('\n').filter(line => line.trim() !== '');
      } else if (value.startsWith('{') && value.endsWith('}')) {
        // Try to parse as JSON object
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      
      setVariables(prev => ({
        ...prev,
        [name]: parsedValue
      }));
    } catch (error) {
      console.error('Error parsing variable value:', error);
    }
  };

  const handleApply = () => {
    if (!config) return;
    
    // Save changes first
    updateConfig.mutate({
      id: config.id,
      content: code,
      variables: variables
    }, {
      onSuccess: () => {
        // Then trigger Terraform apply via WebSocket
        if (sendTerraformApply(socket, config.id)) {
          toast({
            title: "Terraform Apply Started",
            description: "The configuration is being applied. Check console for updates.",
          });
        } else {
          toast({
            title: "Connection Issue",
            description: "Couldn't connect to the server. Please try again.",
            variant: "destructive"
          });
        }
      }
    });
  };

  const handleApplyWithExecution = () => {
    if (!config) return;
    
    // Save changes first
    updateConfig.mutate({
      id: config.id,
      content: code,
      variables: variables
    }, {
      onSuccess: () => {
        // Then trigger Terraform apply via WebSocket with selected execution mode
        if (sendTerraformApply(socket, config.id, executionMode)) {
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
      }
    });
  };

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <p className="text-center text-gray-500">No Terraform configuration available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <Label htmlFor="execution-mode" className="font-medium">Execution Mode:</Label>
          <Select value={executionMode} onValueChange={(value: 'cloud' | 'local') => setExecutionMode(value)}>
            <SelectTrigger id="execution-mode" className="w-[180px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local Development (localhost)</SelectItem>
              <SelectItem value="cloud">Cloud Environment (simulated)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleApplyWithExecution} 
          className="bg-gradient-to-r from-green-500 to-teal-500 text-white"
        >
          Apply Configuration
        </Button>
      </div>
      
      <CodeEditorWithVariables
        title="Terraform Configuration"
        code={code}
        variables={variables}
        language="hcl"
        onChange={handleCodeChange}
        onVariableChange={handleVariableChange}
        actionButton={false}
      />
    </div>
  );
}
