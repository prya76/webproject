import { useResources, useCreateResource, useUpdateResourceStatus } from "@/lib/infrastructure";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ResourceList from "@/components/resources/resource-list";
import ResourceForm from "@/components/resources/resource-form";
import { Helmet } from "react-helmet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResourcesPage() {
  const { data: resources, isLoading } = useResources();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Resources | InfraManager</title>
        <meta name="description" content="Monitor and manage your infrastructure resources with real-time status updates." />
      </Helmet>
      <div className="p-6 bg-neutral-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Infrastructure Resources</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
              </DialogHeader>
              <ResourceForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <ResourceList resources={resources || []} />
        )}
      </div>
    </>
  );
}
