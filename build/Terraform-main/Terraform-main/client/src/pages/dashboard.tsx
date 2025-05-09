import Dashboard from "@/components/dashboard";
import { Helmet } from "react-helmet";

export default function DashboardPage() {
  return (
    <>
      <Helmet>
        <title>Infrastructure Dashboard | InfraManager</title>
        <meta name="description" content="Real-time overview of your infrastructure resources, deployments, and automation status." />
      </Helmet>
      <Dashboard />
    </>
  );
}
