import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("user"),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // server, database, storage, etc.
  status: text("status").notNull().default("healthy"), // healthy, warning, error
  details: jsonb("details"), // store additional details like ID, uptime, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const terraformConfigs = pgTable("terraform_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  variables: jsonb("variables"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ansiblePlaybooks = pgTable("ansible_playbooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const infraTemplates = pgTable("infra_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  provider: text("provider").notNull(), // AWS, GCP, Azure, etc.
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
  logs: text("logs"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  name: true,
  type: true,
  status: true,
  details: true,
});

export const insertTerraformConfigSchema = createInsertSchema(terraformConfigs).pick({
  name: true,
  content: true,
  variables: true,
});

export const insertAnsiblePlaybookSchema = createInsertSchema(ansiblePlaybooks).pick({
  name: true,
  content: true,
});

export const insertInfraTemplateSchema = createInsertSchema(infraTemplates).pick({
  name: true,
  description: true,
  provider: true,
  content: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).pick({
  name: true,
  status: true,
  logs: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type InsertTerraformConfig = z.infer<typeof insertTerraformConfigSchema>;
export type TerraformConfig = typeof terraformConfigs.$inferSelect;

export type InsertAnsiblePlaybook = z.infer<typeof insertAnsiblePlaybookSchema>;
export type AnsiblePlaybook = typeof ansiblePlaybooks.$inferSelect;

export type InsertInfraTemplate = z.infer<typeof insertInfraTemplateSchema>;
export type InfraTemplate = typeof infraTemplates.$inferSelect;

export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;
