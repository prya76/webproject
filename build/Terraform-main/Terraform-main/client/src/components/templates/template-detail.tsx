import { InfraTemplate } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { useCreateInfraTemplate } from "@/lib/infrastructure";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PlayIcon, FileCode, Download } from "lucide-react";

interface TemplateDetailProps {
  template?: InfraTemplate;
  mode: 'view' | 'create';
  onSuccess?: () => void;
}

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  provider: z.string().min(1, "Provider is required"),
  content: z.string().min(1, "Template content is required")
});

export default function TemplateDetail({ template, mode, onSuccess }: TemplateDetailProps) {
  const createTemplate = useCreateInfraTemplate();
  const { toast } = useToast();
  const [code, setCode] = useState(template?.content || "");

  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      provider: template?.provider || "AWS",
      content: template?.content || ""
    }
  });

  const onSubmit = (values: z.infer<typeof templateFormSchema>) => {
    createTemplate.mutate({
      name: values.name,
      description: values.description,
      provider: values.provider,
      content: values.content
    }, {
      onSuccess: () => {
        toast({
          title: "Template Created",
          description: "Infrastructure template has been created successfully"
        });
        if (onSuccess) onSuccess();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive"
        });
      }
    });
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    form.setValue('content', newCode);
  };

  if (mode === 'create') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="Web Application Stack" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Standard web application architecture with load balancer, auto-scaling group, and database." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cloud Provider</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="GCP">GCP</SelectItem>
                    <SelectItem value="Azure">Azure</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Content</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Infrastructure as code template..." 
                    className="font-mono h-64"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full mt-4"
            disabled={createTemplate.isPending}
          >
            {createTemplate.isPending ? "Creating..." : "Create Template"}
          </Button>
        </form>
      </Form>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-neutral-3">Select a template to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="mb-1">{template.name}</CardTitle>
            {template.description && (
              <p className="text-sm text-neutral-3">{template.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button className="bg-primary text-white" size="sm">
              <PlayIcon className="h-4 w-4 mr-1" /> Use Template
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 bg-neutral-1 flex items-center text-sm">
          <FileCode className="h-4 w-4 mr-2 text-neutral-4" />
          <span className="font-medium">Terraform Configuration</span>
          <Badge className="ml-2 text-xs bg-neutral-2 text-neutral-4 px-2 py-0.5 rounded-full">
            {template.provider}
          </Badge>
        </div>
        <CodeEditor
          title=""
          code={template.content}
          language="hcl"
          readOnly={true}
        />
      </CardContent>
    </Card>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {children}
    </span>
  );
}
