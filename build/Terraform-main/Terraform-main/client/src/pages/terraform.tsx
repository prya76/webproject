import TerraformPage from "@/components/terraform/terraform-page";
import { Helmet } from "react-helmet";

export default function TerraformPageContainer() {
  return (
    <>
      <Helmet>
        <title>Terraform Configurations | InfraManager</title>
        <meta 
          name="description" 
          content="Manage and deploy your Terraform configurations with real-time feedback and variable management." 
        />
      </Helmet>
      <TerraformPage />
    </>
  );
}
