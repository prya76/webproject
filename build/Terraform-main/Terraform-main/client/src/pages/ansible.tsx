import AnsiblePage from "@/components/ansible/ansible-page";
import { Helmet } from "react-helmet";

export default function AnsiblePageContainer() {
  return (
    <>
      <Helmet>
        <title>Ansible Automation | InfraManager</title>
        <meta 
          name="description" 
          content="Execute and monitor Ansible playbooks with real-time console output and execution history." 
        />
      </Helmet>
      <AnsiblePage />
    </>
  );
}
