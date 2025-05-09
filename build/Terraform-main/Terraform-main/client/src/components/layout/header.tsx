import { Link, useLocation } from "wouter";
import { Bell, HelpCircle, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const pageTitle = {
  '/': 'Infrastructure Dashboard',
  '/resources': 'Resources',
  '/terraform': 'Terraform Configurations',
  '/ansible': 'Ansible Automation',
  '/reports': 'Reports & Analytics',
  '/templates': 'Infrastructure Templates',
  '/settings': 'Settings',
};

export default function Header() {
  const [location] = useLocation();
  const title = pageTitle[location as keyof typeof pageTitle] || 'InfraManager';

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
      <div className="flex items-center">
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" title="Notifications">
          <Bell className="h-5 w-5 text-neutral-4" />
        </Button>
        <Button variant="ghost" size="icon" className="mr-2" title="Help">
          <HelpCircle className="h-5 w-5 text-neutral-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="More Actions">
              <MoreVertical className="h-5 w-5 text-neutral-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Export Dashboard</DropdownMenuItem>
            <DropdownMenuItem>Print Report</DropdownMenuItem>
            <DropdownMenuItem>Refresh Data</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
