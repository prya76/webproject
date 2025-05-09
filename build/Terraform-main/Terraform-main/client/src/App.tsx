import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import DashboardPage from "@/pages/dashboard";
import TerraformPage from "@/pages/terraform";
import AnsiblePage from "@/pages/ansible";
import ResourcesPage from "@/pages/resources";
import TemplatesPage from "@/pages/templates";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import SideNavigation from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  return (
    <div className="flex h-screen bg-neutral-1">
      <SideNavigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/terraform" component={TerraformPage} />
            <Route path="/ansible" component={AnsiblePage} />
            <Route path="/resources" component={ResourcesPage} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
