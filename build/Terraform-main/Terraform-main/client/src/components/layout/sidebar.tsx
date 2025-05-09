import { Link, useLocation } from "wouter";
import { HardDrive, LayoutDashboard, Cpu, FileCode, Code2, BarChart, BookTemplate, Settings, User } from "lucide-react";

const NavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) => (
  <Link href={to}>
    <li className={`nav-item px-4 py-3 flex items-center cursor-pointer ${active ? 'active' : ''}`}>
      <span className={`mr-3 ${active ? 'text-primary' : 'text-neutral-4'}`}>{icon}</span>
      <span className={active ? 'text-primary font-medium' : ''}>{label}</span>
    </li>
  </Link>
);

export default function SideNavigation() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-sidebar shadow-lg flex flex-col z-10 text-sidebar-foreground">
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <HardDrive className="text-primary mr-2" />
        <h1 className="text-lg font-medium">InfraManager</h1>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <ul className="py-4">
          <NavItem
            to="/"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={location === '/'}
          />
          <NavItem
            to="/resources"
            icon={<Cpu size={20} />}
            label="Resources"
            active={location === '/resources'}
          />
          <NavItem
            to="/terraform"
            icon={<FileCode size={20} />}
            label="Terraform"
            active={location === '/terraform'}
          />
          <NavItem
            to="/ansible"
            icon={<Code2 size={20} />}
            label="Ansible"
            active={location === '/ansible'}
          />
          <NavItem
            to="/reports"
            icon={<BarChart size={20} />}
            label="Reports"
            active={location === '/reports'}
          />
          <NavItem
            to="/templates"
            icon={<BookTemplate size={20} />}
            label="Templates"
            active={location === '/templates'}
          />
          <NavItem
            to="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            active={location === '/settings'}
          />
        </ul>
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-neutral-2 flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-neutral-4" />
          </div>
          <div>
            <p className="font-medium text-sm">Alex Johnson</p>
            <p className="text-xs text-neutral-3">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
