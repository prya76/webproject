import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import { queryClient } from './queryClient';
import { 
  Resource, 
  TerraformConfig, 
  AnsiblePlaybook, 
  InfraTemplate, 
  Deployment 
} from '@shared/schema';

// Resource related hooks
export const useResources = () => {
  return useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });
};

export const useCreateResource = () => {
  return useMutation({
    mutationFn: async (resource: Omit<Resource, 'id' | 'createdAt'>) => {
      const response = await apiRequest('POST', '/api/resources', resource);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    },
  });
};

export const useUpdateResourceStatus = () => {
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/resources/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    },
  });
};

// Terraform related hooks
export const useTerraformConfigs = () => {
  return useQuery<TerraformConfig[]>({
    queryKey: ['/api/terraform'],
  });
};

export const useTerraformConfig = (id: number) => {
  return useQuery<TerraformConfig>({
    queryKey: ['/api/terraform', id],
    enabled: !!id,
  });
};

export const useCreateTerraformConfig = () => {
  return useMutation({
    mutationFn: async (config: Omit<TerraformConfig, 'id' | 'createdAt'>) => {
      const response = await apiRequest('POST', '/api/terraform', config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terraform'] });
    },
  });
};

export const useUpdateTerraformConfig = () => {
  return useMutation({
    mutationFn: async ({ id, ...config }: { id: number } & Partial<Omit<TerraformConfig, 'id' | 'createdAt'>>) => {
      const response = await apiRequest('PUT', `/api/terraform/${id}`, config);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/terraform'] });
      queryClient.invalidateQueries({ queryKey: ['/api/terraform', variables.id] });
    },
  });
};

// Ansible related hooks
export const useAnsiblePlaybooks = () => {
  return useQuery<AnsiblePlaybook[]>({
    queryKey: ['/api/ansible'],
  });
};

export const useAnsiblePlaybook = (id: number) => {
  return useQuery<AnsiblePlaybook>({
    queryKey: ['/api/ansible', id],
    enabled: !!id,
  });
};

export const useCreateAnsiblePlaybook = () => {
  return useMutation({
    mutationFn: async (playbook: Omit<AnsiblePlaybook, 'id' | 'lastRun' | 'createdAt'>) => {
      const response = await apiRequest('POST', '/api/ansible', playbook);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ansible'] });
    },
  });
};

export const useUpdateAnsiblePlaybook = () => {
  return useMutation({
    mutationFn: async ({ id, ...playbook }: { id: number } & Partial<Omit<AnsiblePlaybook, 'id' | 'lastRun' | 'createdAt'>>) => {
      const response = await apiRequest('PUT', `/api/ansible/${id}`, playbook);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ansible'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ansible', variables.id] });
    },
  });
};

// Template related hooks
export const useInfraTemplates = () => {
  return useQuery<InfraTemplate[]>({
    queryKey: ['/api/templates'],
  });
};

export const useInfraTemplate = (id: number) => {
  return useQuery<InfraTemplate>({
    queryKey: ['/api/templates', id],
    enabled: !!id,
  });
};

export const useCreateInfraTemplate = () => {
  return useMutation({
    mutationFn: async (template: Omit<InfraTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest('POST', '/api/templates', template);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
};

// Deployment related hooks
export const useDeployments = () => {
  return useQuery<Deployment[]>({
    queryKey: ['/api/deployments'],
  });
};

// WebSocket message sender helpers
export function sendTerraformApply(socket: WebSocket | null, configId: number, executionMode: 'cloud' | 'local' = 'local') {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'terraform_apply',
      configId,
      executionMode
    }));
    return true;
  }
  return false;
}

export function sendAnsibleRun(socket: WebSocket | null, playbookId: number, executionMode: 'cloud' | 'local' = 'local') {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'ansible_run',
      playbookId,
      executionMode
    }));
    return true;
  }
  return false;
}

export function sendResourceUpdate(socket: WebSocket | null, resourceId: number, status: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'resource_update',
      resourceId,
      status
    }));
    return true;
  }
  return false;
}
