import { useInfraTemplates, useCreateInfraTemplate } from "@/lib/infrastructure";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TemplateList from "@/components/templates/template-list";
import TemplateDetail from "@/components/templates/template-detail";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TemplatesPage() {
  const { data: templates, isLoading } = useInfraTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTemplateSelect = (id: number) => {
    setSelectedTemplateId(id);
  };

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  return (
    <>
      <Helmet>
        <title>Infrastructure Templates | InfraManager</title>
        <meta name="description" content="Browse and use pre-configured infrastructure templates for quick deployment." />
      </Helmet>
      <div className="p-6 bg-neutral-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Infrastructure Templates</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white">
                <Plus className="h-4 w-4 mr-2" /> New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[675px]">
              <DialogHeader>
                <DialogTitle>Create Infrastructure Template</DialogTitle>
              </DialogHeader>
              <TemplateDetail 
                mode="create" 
                onSuccess={() => {
                  setDialogOpen(false);
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[600px] col-span-1" />
            <Skeleton className="h-[600px] col-span-2" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <TemplateList 
                templates={templates || []} 
                onSelect={handleTemplateSelect}
                selectedId={selectedTemplateId}
              />
            </div>
            <div className="col-span-2">
              {selectedTemplate ? (
                <TemplateDetail 
                  template={selectedTemplate}
                  mode="view"
                />
              ) : (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-neutral-3">Select a template to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
