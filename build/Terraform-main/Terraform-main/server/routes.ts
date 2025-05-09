import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { 
  insertResourceSchema, 
  insertTerraformConfigSchema, 
  insertAnsiblePlaybookSchema, 
  insertInfraTemplateSchema,
  insertDeploymentSchema
} from "@shared/schema";
import { executeTerraformLocally, executeAnsibleLocally } from "./local-executor";

type ConnectedClient = {
  ws: WebSocket;
  id: string;
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients: ConnectedClient[] = [];

  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    connectedClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  // WebSocket server setup
  wss.on('connection', (ws) => {
    console.log('Client connected');
    const clientId = Math.random().toString(36).substring(2, 15);
    connectedClients.push({ ws, id: clientId });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
      const index = connectedClients.findIndex((client) => client.id === clientId);
      if (index !== -1) {
        connectedClients.splice(index, 1);
      }
    });

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);

        // Handle different message types
        if (data.type === 'terraform_apply') {
          const executionMode = data.executionMode || 'local';
          console.log(`Executing Terraform in ${executionMode} mode for config ${data.configId}`);
          
          if (executionMode === 'local') {
            // Execute using the local executor
            await executeTerraformLocallyWithFeedback(clientId, data.configId);
          } else {
            // Use cloud/simulation execution
            await simulateTerraformApply(clientId, data.configId);
          }
        } else if (data.type === 'ansible_run') {
          const executionMode = data.executionMode || 'local';
          console.log(`Executing Ansible in ${executionMode} mode for playbook ${data.playbookId}`);
          
          if (executionMode === 'local') {
            // Execute using the local executor
            await executeAnsibleLocallyWithFeedback(clientId, data.playbookId);
          } else {
            // Use cloud/simulation execution
            await simulateAnsibleRun(clientId, data.playbookId);
          }
        } else if (data.type === 'terraform_apply_simulation') {
          // Legacy simulation mode (kept for backward compatibility)
          await simulateTerraformApply(clientId, data.configId);
        } else if (data.type === 'ansible_run_simulation') {
          // Legacy simulation mode (kept for backward compatibility)
          await simulateAnsibleRun(clientId, data.playbookId);
        } else if (data.type === 'resource_update') {
          // Update resource status
          if (data.resourceId && data.status) {
            const resource = await storage.updateResourceStatus(data.resourceId, data.status);
            if (resource) {
              broadcast({
                type: 'resource_updated',
                resource
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Error processing your request' 
        }));
      }
    });

    // Send initial data to the client upon connection
    sendInitialData(ws);
  });

  // Send initial data to a newly connected client
  async function sendInitialData(ws: WebSocket) {
    try {
      const resources = await storage.getResources();
      const terraformConfigs = await storage.getTerraformConfigs();
      const ansiblePlaybooks = await storage.getAnsiblePlaybooks();
      const deployments = await storage.getDeployments();
      const templates = await storage.getInfraTemplates();

      ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
          resources,
          terraformConfigs,
          ansiblePlaybooks,
          deployments,
          templates
        }
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  // Execute Terraform locally with real-time feedback
  async function executeTerraformLocallyWithFeedback(clientId: string, configId: number) {
    try {
      const client = connectedClients.find(c => c.id === clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) return;

      const config = await storage.getTerraformConfig(configId);
      if (!config) {
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Terraform configuration not found'
        }));
        return;
      }

      // Create a new deployment record
      const deployment = await storage.createDeployment({
        name: `Terraform apply (localhost): ${config.name}`,
        status: 'in_progress',
        logs: 'Starting local Terraform execution...'
      });

      // Broadcast new deployment to all clients
      broadcast({
        type: 'deployment_started',
        deployment
      });

      // Execute Terraform locally (will send real-time updates via WebSocket)
      try {
        await executeTerraformLocally(
          configId,
          config.content,
          client.ws,
          deployment.id,
          config.variables || {}
        );

        // Complete the deployment
        const completedDeployment = await storage.completeDeployment(deployment.id, 'completed');
        
        broadcast({
          type: 'deployment_completed',
          deployment: completedDeployment
        });

        // Create a local resource to track the result
        const newResource = await storage.createResource({
          name: `Local Terraform Resource: ${config.name}`,
          type: 'local',
          status: 'healthy',
          details: {
            id: `local-${Math.random().toString(36).substring(2, 10)}`,
            source: 'localhost',
            configId: config.id
          }
        });

        broadcast({
          type: 'resource_created',
          resource: newResource
        });
      } catch (error) {
        console.error('Error in local Terraform execution:', error);
        
        // Mark deployment as failed
        const failedDeployment = await storage.completeDeployment(deployment.id, 'failed');
        
        broadcast({
          type: 'deployment_completed',
          deployment: failedDeployment
        });
        
        broadcast({
          type: 'terraform_error',
          configId,
          message: `Error executing Terraform locally: ${error}`
        });
      }
    } catch (error) {
      console.error('Error preparing Terraform local execution:', error);
      broadcast({
        type: 'terraform_error',
        configId,
        message: 'Error preparing Terraform local execution'
      });
    }
  }

  // Simulate Terraform apply process
  async function simulateTerraformApply(clientId: string, configId: number) {
    try {
      const client = connectedClients.find(c => c.id === clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) return;

      const config = await storage.getTerraformConfig(configId);
      if (!config) {
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Terraform configuration not found'
        }));
        return;
      }

      // Create a new deployment record
      const deployment = await storage.createDeployment({
        name: `Terraform apply: ${config.name}`,
        status: 'in_progress',
        logs: 'Initializing...'
      });

      // Broadcast new deployment to all clients
      broadcast({
        type: 'deployment_started',
        deployment
      });

      // Send progress updates
      const steps = [
        { message: 'Initializing plugins...', delay: 1000 },
        { message: 'Planning infrastructure changes...', delay: 2000 },
        { message: 'Plan: 3 to add, 0 to change, 0 to destroy.', delay: 1500 },
        { message: 'Applying changes...', delay: 3000 },
        { message: 'Creating AWS VPC...', delay: 2000 },
        { message: 'Creating public subnets...', delay: 2500 },
        { message: 'Configuring route tables...', delay: 1800 },
        { message: 'Apply complete! Resources: 3 added, 0 changed, 0 destroyed.', delay: 1000 }
      ];

      let logs = 'Initializing...\n';
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        logs += `${step.message}\n`;
        
        await storage.updateDeploymentStatus(deployment.id, 'in_progress', logs);
        
        broadcast({
          type: 'terraform_output',
          configId,
          message: step.message,
          deploymentId: deployment.id,
          logs
        });
      }

      // Complete the deployment
      const completedDeployment = await storage.completeDeployment(deployment.id, 'completed');
      
      broadcast({
        type: 'deployment_completed',
        deployment: completedDeployment
      });

      // Create or update some resources as a result of the Terraform apply
      const newResource = await storage.createResource({
        name: 'New VPC Resource',
        type: 'network',
        status: 'healthy',
        details: {
          id: `vpc-${Math.random().toString(36).substring(2, 10)}`,
          region: config.variables?.aws_region || 'us-west-2'
        }
      });

      broadcast({
        type: 'resource_created',
        resource: newResource
      });

    } catch (error) {
      console.error('Error in Terraform apply:', error);
      broadcast({
        type: 'terraform_error',
        configId,
        message: 'Error applying Terraform configuration'
      });
    }
  }

  // Execute Ansible locally with real-time feedback
  async function executeAnsibleLocallyWithFeedback(clientId: string, playbookId: number) {
    try {
      const client = connectedClients.find(c => c.id === clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) return;

      const playbook = await storage.getAnsiblePlaybook(playbookId);
      if (!playbook) {
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Ansible playbook not found'
        }));
        return;
      }

      // Update the last run timestamp
      await storage.updateAnsiblePlaybookLastRun(playbookId);

      // Create a new deployment for the Ansible run
      const deployment = await storage.createDeployment({
        name: `Ansible run (localhost): ${playbook.name}`,
        status: 'in_progress',
        logs: 'Starting local Ansible playbook execution...'
      });

      broadcast({
        type: 'deployment_started',
        deployment
      });

      // Execute Ansible locally (will send real-time updates via WebSocket)
      try {
        await executeAnsibleLocally(
          playbookId,
          playbook.content,
          client.ws,
          deployment.id
        );

        // Complete the deployment
        const completedDeployment = await storage.completeDeployment(deployment.id, 'completed');
        
        broadcast({
          type: 'deployment_completed',
          deployment: completedDeployment
        });

        // Update some resources based on the Ansible run
        const resources = await storage.getResources();
        const localServer = resources.find(r => r.type === 'local');
        
        if (localServer) {
          const updatedResource = await storage.updateResourceStatus(localServer.id, 'configured');
          if (updatedResource) {
            broadcast({
              type: 'resource_updated',
              resource: updatedResource
            });
          }
        } else {
          // Create a local resource to track the result if none exists
          const newResource = await storage.createResource({
            name: `Local Server: localhost`,
            type: 'local',
            status: 'configured',
            details: {
              id: `local-${Math.random().toString(36).substring(2, 10)}`,
              source: 'localhost',
              playbookId: playbook.id
            }
          });

          broadcast({
            type: 'resource_created',
            resource: newResource
          });
        }
      } catch (error) {
        console.error('Error in local Ansible execution:', error);
        
        // Mark deployment as failed
        const failedDeployment = await storage.completeDeployment(deployment.id, 'failed');
        
        broadcast({
          type: 'deployment_completed',
          deployment: failedDeployment
        });
        
        broadcast({
          type: 'ansible_error',
          playbookId,
          message: `Error executing Ansible locally: ${error}`
        });
      }
    } catch (error) {
      console.error('Error preparing Ansible local execution:', error);
      broadcast({
        type: 'ansible_error',
        playbookId,
        message: 'Error preparing Ansible local execution'
      });
    }
  }

  // Simulate Ansible playbook run
  async function simulateAnsibleRun(clientId: string, playbookId: number) {
    try {
      const client = connectedClients.find(c => c.id === clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) return;

      const playbook = await storage.getAnsiblePlaybook(playbookId);
      if (!playbook) {
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Ansible playbook not found'
        }));
        return;
      }

      // Update the last run timestamp
      await storage.updateAnsiblePlaybookLastRun(playbookId);

      // Create a new deployment for the Ansible run
      const deployment = await storage.createDeployment({
        name: `Ansible run: ${playbook.name}`,
        status: 'in_progress',
        logs: 'Starting Ansible playbook execution...'
      });

      broadcast({
        type: 'deployment_started',
        deployment
      });

      // Simulate Ansible output
      const outputs = [
        { message: 'PLAY [web servers] **********************************************************', delay: 800 },
        { message: 'TASK [Gathering Facts] *****************************************************', delay: 1200 },
        { message: 'ok: [web1.example.com]', delay: 500 },
        { message: 'ok: [web2.example.com]', delay: 600 },
        { message: 'ok: [web3.example.com]', delay: 700 },
        { message: 'TASK [Install Apache] ******************************************************', delay: 1500 },
        { message: 'ok: [web1.example.com]', delay: 800 },
        { message: 'ok: [web3.example.com]', delay: 700 },
        { message: 'changed: [web2.example.com]', delay: 1200 },
        { message: 'TASK [Start and enable Apache] ********************************************', delay: 1300 },
        { message: 'ok: [web1.example.com]', delay: 600 },
        { message: 'ok: [web3.example.com]', delay: 700 },
        { message: 'changed: [web2.example.com]', delay: 900 },
        { message: 'TASK [Copy website content] ***********************************************', delay: 1100 },
        { message: 'ok: [web1.example.com]', delay: 500 },
        { message: 'ok: [web2.example.com]', delay: 600 },
        { message: 'ok: [web3.example.com]', delay: 700 },
        { message: 'PLAY RECAP ****************************************************************', delay: 900 },
        { message: 'web1.example.com : ok=4 changed=0 unreachable=0 failed=0', delay: 500 },
        { message: 'web2.example.com : ok=2 changed=2 unreachable=0 failed=0', delay: 600 },
        { message: 'web3.example.com : ok=4 changed=0 unreachable=0 failed=0', delay: 700 }
      ];

      let logs = 'Starting Ansible playbook execution...\n';
      
      for (const output of outputs) {
        await new Promise(resolve => setTimeout(resolve, output.delay));
        logs += `${output.message}\n`;
        
        await storage.updateDeploymentStatus(deployment.id, 'in_progress', logs);
        
        broadcast({
          type: 'ansible_output',
          playbookId,
          message: output.message,
          deploymentId: deployment.id,
          logs
        });
      }

      // Complete the deployment
      const completedDeployment = await storage.completeDeployment(deployment.id, 'completed');
      
      broadcast({
        type: 'deployment_completed',
        deployment: completedDeployment
      });

      // Update some resources based on the Ansible run
      const resources = await storage.getResources();
      const webServer2 = resources.find(r => r.name === 'Web Server 2');
      
      if (webServer2) {
        const updatedResource = await storage.updateResourceStatus(webServer2.id, 'healthy');
        if (updatedResource) {
          broadcast({
            type: 'resource_updated',
            resource: updatedResource
          });
        }
      }

    } catch (error) {
      console.error('Error in Ansible run:', error);
      broadcast({
        type: 'ansible_error',
        playbookId,
        message: 'Error executing Ansible playbook'
      });
    }
  }

  // REST API endpoints
  // Resources endpoints
  app.get('/api/resources', async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  });

  app.post('/api/resources', async (req, res) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validatedData);
      
      broadcast({
        type: 'resource_created',
        resource
      });
      
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid resource data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create resource' });
      }
    }
  });

  app.put('/api/resources/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = req.body.status;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const resource = await storage.updateResourceStatus(id, status);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      broadcast({
        type: 'resource_updated',
        resource
      });
      
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update resource status' });
    }
  });

  // Terraform configs endpoints
  app.get('/api/terraform', async (req, res) => {
    try {
      const configs = await storage.getTerraformConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch Terraform configurations' });
    }
  });

  app.get('/api/terraform/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getTerraformConfig(id);
      
      if (!config) {
        return res.status(404).json({ message: 'Terraform configuration not found' });
      }
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch Terraform configuration' });
    }
  });

  app.post('/api/terraform', async (req, res) => {
    try {
      const validatedData = insertTerraformConfigSchema.parse(req.body);
      const config = await storage.createTerraformConfig(validatedData);
      
      broadcast({
        type: 'terraform_config_created',
        config
      });
      
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid configuration data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create Terraform configuration' });
      }
    }
  });

  app.put('/api/terraform/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const configUpdate = req.body;
      
      const config = await storage.updateTerraformConfig(id, configUpdate);
      
      if (!config) {
        return res.status(404).json({ message: 'Terraform configuration not found' });
      }
      
      broadcast({
        type: 'terraform_config_updated',
        config
      });
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update Terraform configuration' });
    }
  });

  // Ansible playbooks endpoints
  app.get('/api/ansible', async (req, res) => {
    try {
      const playbooks = await storage.getAnsiblePlaybooks();
      res.json(playbooks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch Ansible playbooks' });
    }
  });

  app.get('/api/ansible/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playbook = await storage.getAnsiblePlaybook(id);
      
      if (!playbook) {
        return res.status(404).json({ message: 'Ansible playbook not found' });
      }
      
      res.json(playbook);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch Ansible playbook' });
    }
  });

  app.post('/api/ansible', async (req, res) => {
    try {
      const validatedData = insertAnsiblePlaybookSchema.parse(req.body);
      const playbook = await storage.createAnsiblePlaybook(validatedData);
      
      broadcast({
        type: 'ansible_playbook_created',
        playbook
      });
      
      res.status(201).json(playbook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid playbook data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create Ansible playbook' });
      }
    }
  });

  app.put('/api/ansible/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playbookUpdate = req.body;
      
      const playbook = await storage.updateAnsiblePlaybook(id, playbookUpdate);
      
      if (!playbook) {
        return res.status(404).json({ message: 'Ansible playbook not found' });
      }
      
      broadcast({
        type: 'ansible_playbook_updated',
        playbook
      });
      
      res.json(playbook);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update Ansible playbook' });
    }
  });

  // Infrastructure templates endpoints
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getInfraTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch infrastructure templates' });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getInfraTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: 'Infrastructure template not found' });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch infrastructure template' });
    }
  });

  app.post('/api/templates', async (req, res) => {
    try {
      const validatedData = insertInfraTemplateSchema.parse(req.body);
      const template = await storage.createInfraTemplate(validatedData);
      
      broadcast({
        type: 'template_created',
        template
      });
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid template data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create infrastructure template' });
      }
    }
  });

  // Deployments endpoints
  app.get('/api/deployments', async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deployments' });
    }
  });

  return httpServer;
}
