import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateResource } from "@/lib/infrastructure";
import { useToast } from "@/hooks/use-toast";

interface ResourceFormProps {
  onSuccess?: () => void;
}

const resourceFormSchema = z.object({
  name: z.string().min(1, "Resource name is required"),
  type: z.string().min(1, "Resource type is required"),
  status: z.string().min(1, "Status is required"),
  details: z.object({
    id: z.string().optional(),
    uptime: z.string().optional(),
    region: z.string().optional(),
    warning: z.string().optional(),
    error: z.string().optional(),
    state: z.string().optional()
  }).optional()
});

export default function ResourceForm({ onSuccess }: ResourceFormProps) {
  const createResource = useCreateResource();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof resourceFormSchema>>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      name: "",
      type: "server",
      status: "healthy",
      details: {
        id: "",
        uptime: "0d 0h",
        region: "us-west-2"
      }
    }
  });

  const onSubmit = (values: z.infer<typeof resourceFormSchema>) => {
    // Format details properly
    const details: Record<string, any> = { ...values.details };
    
    // Remove empty fields
    Object.keys(details).forEach(key => {
      if (details[key] === "") {
        delete details[key];
      }
    });

    createResource.mutate({
      name: values.name,
      type: values.type,
      status: values.status,
      details
    }, {
      onSuccess: () => {
        toast({
          title: "Resource Created",
          description: "New resource has been created successfully"
        });
        form.reset();
        if (onSuccess) onSuccess();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create resource",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource Name</FormLabel>
              <FormControl>
                <Input placeholder="Web Server 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="details.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource ID</FormLabel>
              <FormControl>
                <Input placeholder="i-01234567890abcdef" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="details.uptime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uptime</FormLabel>
                <FormControl>
                  <Input placeholder="7d 4h" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="details.region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input placeholder="us-west-2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch("status") === "warning" && (
          <FormField
            control={form.control}
            name="details.warning"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warning Message</FormLabel>
                <FormControl>
                  <Textarea placeholder="Warning details..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("status") === "error" && (
          <FormField
            control={form.control}
            name="details.error"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Error Message</FormLabel>
                <FormControl>
                  <Textarea placeholder="Error details..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full mt-4"
          disabled={createResource.isPending}
        >
          {createResource.isPending ? "Creating..." : "Create Resource"}
        </Button>
      </form>
    </Form>
  );
}
