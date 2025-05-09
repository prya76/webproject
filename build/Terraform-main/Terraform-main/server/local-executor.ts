import { exec } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { WebSocket } from 'ws';

const execAsync = promisify(exec);

// Base directory for all local executions
const BASE_DIR = './local-executions';

// Create workspace for Terraform or Ansible executions
async function createWorkspace(type: 'terraform' | 'ansible', id: number): Promise<string> {
  const dir = join(BASE_DIR, type, `${id}-${Date.now()}`);
  
  try {
    await mkdir(dir, { recursive: true });
    return dir;
  } catch (error) {
    console.error(`Error creating workspace directory: ${error}`);
    throw new Error(`Failed to create workspace: ${error}`);
  }
}

// Write configuration content to file
async function writeConfigFile(dir: string, content: string, filename: string): Promise<string> {
  const filePath = join(dir, filename);
  
  try {
    await writeFile(filePath, content);
    return filePath;
  } catch (error) {
    console.error(`Error writing config file: ${error}`);
    throw new Error(`Failed to write configuration file: ${error}`);
  }
}

// Execute command and stream output
async function executeCommand(
  command: string, 
  dir: string, 
  ws: WebSocket | null, 
  messageType: string,
  id: number,
  deploymentId: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, { cwd: dir });
    let output = '';
    
    childProcess.stdout?.on('data', (data) => {
      output += data.toString();
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: messageType,
          id,
          deploymentId,
          message: data.toString(),
          logs: output
        }));
      }
    });
    
    childProcess.stderr?.on('data', (data) => {
      output += data.toString();
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: messageType,
          id,
          deploymentId,
          message: data.toString(),
          logs: output
        }));
      }
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command exited with code ${code}: ${output}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Execute Terraform locally
export async function executeTerraformLocally(
  configId: number,
  content: string,
  ws: WebSocket | null,
  deploymentId: number,
  variables?: Record<string, any>
): Promise<string> {
  try {
    // Create workspace directory
    const dir = await createWorkspace('terraform', configId);
    
    // Write main.tf file
    await writeConfigFile(dir, content, 'main.tf');
    
    // Write terraform.tfvars file if variables provided
    if (variables && Object.keys(variables).length > 0) {
      let varsContent = '';
      
      for (const [key, value] of Object.entries(variables)) {
        if (typeof value === 'string') {
          varsContent += `${key} = "${value}"\n`;
        } else {
          varsContent += `${key} = ${value}\n`;
        }
      }
      
      await writeConfigFile(dir, varsContent, 'terraform.tfvars');
    }
    
    // Mock execution only - in a real environment you would run actual Terraform commands
    const initOutput = await executeCommand(
      'echo "Initializing terraform in local environment..." && sleep 2 && echo "Terraform has been successfully initialized!"', 
      dir, 
      ws, 
      'terraform_output', 
      configId,
      deploymentId
    );
    
    const planOutput = await executeCommand(
      'echo "Planning terraform deployment..." && sleep 3 && echo "Plan: 3 to add, 0 to change, 0 to destroy."', 
      dir, 
      ws, 
      'terraform_output', 
      configId,
      deploymentId
    );
    
    const applyOutput = await executeCommand(
      'echo "Applying terraform changes..." && sleep 5 && echo "Apply complete! Resources: 3 added, 0 changed, 0 destroyed."', 
      dir, 
      ws, 
      'terraform_output', 
      configId,
      deploymentId
    );
    
    return `${initOutput}\n${planOutput}\n${applyOutput}`;
  } catch (error) {
    console.error(`Error executing Terraform locally: ${error}`);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'terraform_error',
        configId,
        message: `Error: ${error}`
      }));
    }
    throw error;
  }
}

// Execute Ansible locally
export async function executeAnsibleLocally(
  playbookId: number,
  content: string,
  ws: WebSocket | null,
  deploymentId: number
): Promise<string> {
  try {
    // Create workspace directory
    const dir = await createWorkspace('ansible', playbookId);
    
    // Write playbook file
    await writeConfigFile(dir, content, 'playbook.yml');
    
    // Write inventory file (localhost)
    const inventoryContent = `
[local]
localhost ansible_connection=local

[web_servers]
localhost ansible_connection=local

[db_servers]
localhost ansible_connection=local
`;
    
    await writeConfigFile(dir, inventoryContent, 'inventory');
    
    // Mock execution only - in a real environment you would run actual Ansible commands
    return await executeCommand(
      'echo "PLAY [localhost]" && sleep 1 && ' +
      'echo "TASK [Gathering Facts]" && sleep 2 && ' +
      'echo "ok: [localhost]" && sleep 1 && ' +
      'echo "TASK [Echo message]" && sleep 1 && ' +
      'echo "changed: [localhost]" && sleep 1 && ' +
      'echo "PLAY RECAP" && sleep 1 && ' +
      'echo "localhost : ok=2 changed=1 unreachable=0 failed=0"', 
      dir, 
      ws, 
      'ansible_output', 
      playbookId,
      deploymentId
    );
  } catch (error) {
    console.error(`Error executing Ansible locally: ${error}`);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ansible_error',
        playbookId,
        message: `Error: ${error}`
      }));
    }
    throw error;
  }
}