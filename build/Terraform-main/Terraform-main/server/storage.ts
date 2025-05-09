import {
  users, resources, terraformConfigs, ansiblePlaybooks, 
  infraTemplates, deployments, type User, type InsertUser,
  type Resource, type InsertResource, type TerraformConfig,
  type InsertTerraformConfig, type AnsiblePlaybook, type InsertAnsiblePlaybook,
  type InfraTemplate, type InsertInfraTemplate, type Deployment, type InsertDeployment
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Resource operations
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResourceStatus(id: number, status: string): Promise<Resource | undefined>;
  
  // Terraform operations
  getTerraformConfigs(): Promise<TerraformConfig[]>;
  getTerraformConfig(id: number): Promise<TerraformConfig | undefined>;
  createTerraformConfig(config: InsertTerraformConfig): Promise<TerraformConfig>;
  updateTerraformConfig(id: number, config: Partial<InsertTerraformConfig>): Promise<TerraformConfig | undefined>;
  
  // Ansible operations
  getAnsiblePlaybooks(): Promise<AnsiblePlaybook[]>;
  getAnsiblePlaybook(id: number): Promise<AnsiblePlaybook | undefined>;
  createAnsiblePlaybook(playbook: InsertAnsiblePlaybook): Promise<AnsiblePlaybook>;
  updateAnsiblePlaybook(id: number, playbook: Partial<InsertAnsiblePlaybook>): Promise<AnsiblePlaybook | undefined>;
  updateAnsiblePlaybookLastRun(id: number): Promise<AnsiblePlaybook | undefined>;
  
  // Template operations
  getInfraTemplates(): Promise<InfraTemplate[]>;
  getInfraTemplate(id: number): Promise<InfraTemplate | undefined>;
  createInfraTemplate(template: InsertInfraTemplate): Promise<InfraTemplate>;
  
  // Deployment operations
  getDeployments(): Promise<Deployment[]>;
  getDeployment(id: number): Promise<Deployment | undefined>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeploymentStatus(id: number, status: string, logs?: string): Promise<Deployment | undefined>;
  completeDeployment(id: number, status: string): Promise<Deployment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resources: Map<number, Resource>;
  private terraformConfigs: Map<number, TerraformConfig>;
  private ansiblePlaybooks: Map<number, AnsiblePlaybook>;
  private infraTemplates: Map<number, InfraTemplate>;
  private deployments: Map<number, Deployment>;
  
  private userCurrentId: number;
  private resourceCurrentId: number;
  private terraformConfigCurrentId: number;
  private ansiblePlaybookCurrentId: number;
  private infraTemplateCurrentId: number;
  private deploymentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.resources = new Map();
    this.terraformConfigs = new Map();
    this.ansiblePlaybooks = new Map();
    this.infraTemplates = new Map();
    this.deployments = new Map();
    
    this.userCurrentId = 1;
    this.resourceCurrentId = 1;
    this.terraformConfigCurrentId = 1;
    this.ansiblePlaybookCurrentId = 1;
    this.infraTemplateCurrentId = 1;
    this.deploymentCurrentId = 1;
    
    // Initialize some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create a default user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Alex Johnson",
      role: "Administrator"
    });

    // Create some resources
    this.createResource({
      name: "Web Server 1",
      type: "server",
      status: "healthy",
      details: {
        id: "i-01234567890abcdef",
        uptime: "7d 4h",
      }
    });

    this.createResource({
      name: "Web Server 2",
      type: "server",
      status: "warning",
      details: {
        id: "i-abcdef01234567890",
        uptime: "14d 2h",
        warning: "CPU usage above 80% for last 30 minutes"
      }
    });
    
    this.createResource({
      name: "Web Server 3",
      type: "server",
      status: "healthy",
      details: {
        id: "i-567890abcdef01234",
        uptime: "3d 12h",
      }
    });
    
    this.createResource({
      name: "Database Cluster",
      type: "database",
      status: "healthy",
      details: {
        id: "db-cluster-01",
        uptime: "21d 8h",
      }
    });
    
    this.createResource({
      name: "Storage Volume",
      type: "storage",
      status: "error",
      details: {
        id: "vol-01234abcdef",
        state: "Degraded",
        error: "Disk health check failed - possible hardware issue"
      }
    });

    // Create a default Terraform config
    this.createTerraformConfig({
      name: "main.tf",
      content: `provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = {
    Name = "main-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count = length(var.public_subnets)
  vpc_id = aws_vpc.main.id
  cidr_block = var.public_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "Public-\${count.index}"
  }
}`,
      variables: {
        aws_region: "us-west-2",
        environment: "production",
        vpc_cidr: "10.0.0.0/16",
        instance_type: "t2.micro",
        public_subnets: ["10.0.1.0/24", "10.0.2.0/24"],
        availability_zones: ["us-west-2a", "us-west-2b"]
      }
    });

    // Create ansible playbooks
    this.createAnsiblePlaybook({
      name: "web-server-setup.yml",
      content: `---
- name: Web Server Setup
  hosts: web_servers
  become: yes
  tasks:
    - name: Install Apache
      apt:
        name: apache2
        state: present
        update_cache: yes
    
    - name: Start and enable Apache
      service:
        name: apache2
        state: started
        enabled: yes
        
    - name: Copy website content
      copy:
        src: files/index.html
        dest: /var/www/html/index.html
        owner: www-data
        group: www-data
        mode: '0644'`
    });

    this.createAnsiblePlaybook({
      name: "database-configure.yml",
      content: `---
- name: Database Server Configuration
  hosts: db_servers
  become: yes
  tasks:
    - name: Install PostgreSQL
      apt:
        name: postgresql
        state: present
        update_cache: yes
    
    - name: Ensure PostgreSQL is started
      service:
        name: postgresql
        state: started
        enabled: yes
        
    - name: Create application database
      postgresql_db:
        name: app_database
        state: present
      become_user: postgres`
    });

    this.createAnsiblePlaybook({
      name: "security-patch.yml",
      content: `---
- name: Apply Security Patches
  hosts: all
  become: yes
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        
    - name: Apply security updates
      apt:
        upgrade: dist
        update_cache: yes
      register: update_result
      
    - name: Reboot if required
      reboot:
        msg: "Reboot required after security updates"
      when: update_result.changed`
    });

    // Create infrastructure templates
    this.createInfraTemplate({
      name: "Web Application Stack",
      description: "Standard web application architecture with load balancer, auto-scaling group, and RDS database.",
      provider: "AWS",
      content: `provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name = "web-app-vpc"
  cidr = "10.0.0.0/16"
  azs             = ["us-west-2a", "us-west-2b", "us-west-2c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = {
    Environment = var.environment
    Project = var.project_name
  }
}`
    });

    this.createInfraTemplate({
      name: "Kubernetes Cluster",
      description: "Production-ready Kubernetes cluster with monitoring and logging.",
      provider: "GCP",
      content: `provider "google" {
  credentials = file(var.credentials_file)
  project     = var.project_id
  region      = var.region
}

resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = var.region
  
  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary_preemptible_nodes" {
  name       = "my-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.gke_num_nodes

  node_config {
    preemptible  = true
    machine_type = var.machine_type

    oauth_scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }
}`
    });

    this.createInfraTemplate({
      name: "Serverless API",
      description: "Lambda functions with API Gateway, DynamoDB, and S3 storage.",
      provider: "AWS",
      content: `provider "aws" {
  region = var.aws_region
}

resource "aws_dynamodb_table" "api_table" {
  name           = "$\{var.project_name}-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_s3_bucket" "api_storage" {
  bucket = "$\{var.project_name}-storage"
  acl    = "private"
}

resource "aws_lambda_function" "api_lambda" {
  function_name = "$\{var.project_name}-function"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  filename      = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")
}

resource "aws_api_gateway_rest_api" "api_gateway" {
  name        = "$\{var.project_name}-api"
  description = "Serverless API Gateway"
}`
    });

    // Create some deployments
    this.createDeployment({
      name: "Web Application Stack Deployment",
      status: "in_progress",
      logs: "Provisioning VPC infrastructure..."
    });

    this.createDeployment({
      name: "Database Backup Restore",
      status: "completed",
      logs: "Database restored successfully from backup."
    });

    this.createDeployment({
      name: "Security Patches Application",
      status: "pending",
      logs: ""
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  // Resource methods
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.resourceCurrentId++;
    const now = new Date();
    const resource: Resource = { 
      id, 
      ...insertResource,
      createdAt: now
    };
    this.resources.set(id, resource);
    return resource;
  }

  async updateResourceStatus(id: number, status: string): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const updatedResource = {
      ...resource,
      status
    };
    
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  // Terraform methods
  async getTerraformConfigs(): Promise<TerraformConfig[]> {
    return Array.from(this.terraformConfigs.values());
  }

  async getTerraformConfig(id: number): Promise<TerraformConfig | undefined> {
    return this.terraformConfigs.get(id);
  }

  async createTerraformConfig(insertConfig: InsertTerraformConfig): Promise<TerraformConfig> {
    const id = this.terraformConfigCurrentId++;
    const now = new Date();
    const config: TerraformConfig = {
      id,
      ...insertConfig,
      createdAt: now
    };
    this.terraformConfigs.set(id, config);
    return config;
  }

  async updateTerraformConfig(id: number, configUpdate: Partial<InsertTerraformConfig>): Promise<TerraformConfig | undefined> {
    const config = this.terraformConfigs.get(id);
    if (!config) return undefined;
    
    const updatedConfig = {
      ...config,
      ...configUpdate
    };
    
    this.terraformConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  // Ansible methods
  async getAnsiblePlaybooks(): Promise<AnsiblePlaybook[]> {
    return Array.from(this.ansiblePlaybooks.values());
  }

  async getAnsiblePlaybook(id: number): Promise<AnsiblePlaybook | undefined> {
    return this.ansiblePlaybooks.get(id);
  }

  async createAnsiblePlaybook(insertPlaybook: InsertAnsiblePlaybook): Promise<AnsiblePlaybook> {
    const id = this.ansiblePlaybookCurrentId++;
    const now = new Date();
    const playbook: AnsiblePlaybook = {
      id,
      ...insertPlaybook,
      lastRun: null,
      createdAt: now
    };
    this.ansiblePlaybooks.set(id, playbook);
    return playbook;
  }

  async updateAnsiblePlaybook(id: number, playbookUpdate: Partial<InsertAnsiblePlaybook>): Promise<AnsiblePlaybook | undefined> {
    const playbook = this.ansiblePlaybooks.get(id);
    if (!playbook) return undefined;
    
    const updatedPlaybook = {
      ...playbook,
      ...playbookUpdate
    };
    
    this.ansiblePlaybooks.set(id, updatedPlaybook);
    return updatedPlaybook;
  }

  async updateAnsiblePlaybookLastRun(id: number): Promise<AnsiblePlaybook | undefined> {
    const playbook = this.ansiblePlaybooks.get(id);
    if (!playbook) return undefined;
    
    const updatedPlaybook = {
      ...playbook,
      lastRun: new Date()
    };
    
    this.ansiblePlaybooks.set(id, updatedPlaybook);
    return updatedPlaybook;
  }

  // Template methods
  async getInfraTemplates(): Promise<InfraTemplate[]> {
    return Array.from(this.infraTemplates.values());
  }

  async getInfraTemplate(id: number): Promise<InfraTemplate | undefined> {
    return this.infraTemplates.get(id);
  }

  async createInfraTemplate(insertTemplate: InsertInfraTemplate): Promise<InfraTemplate> {
    const id = this.infraTemplateCurrentId++;
    const now = new Date();
    const template: InfraTemplate = {
      id,
      ...insertTemplate,
      createdAt: now,
      updatedAt: now
    };
    this.infraTemplates.set(id, template);
    return template;
  }

  // Deployment methods
  async getDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values());
  }

  async getDeployment(id: number): Promise<Deployment | undefined> {
    return this.deployments.get(id);
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = this.deploymentCurrentId++;
    const now = new Date();
    const deployment: Deployment = {
      id,
      ...insertDeployment,
      startedAt: now,
      completedAt: null
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async updateDeploymentStatus(id: number, status: string, logs?: string): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    
    const updatedDeployment = {
      ...deployment,
      status,
      logs: logs !== undefined ? logs : deployment.logs
    };
    
    this.deployments.set(id, updatedDeployment);
    return updatedDeployment;
  }

  async completeDeployment(id: number, status: string): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    
    const updatedDeployment = {
      ...deployment,
      status,
      completedAt: new Date()
    };
    
    this.deployments.set(id, updatedDeployment);
    return updatedDeployment;
  }
}

export const storage = new MemStorage();
