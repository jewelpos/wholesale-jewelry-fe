import Content from "@/components/layout/Content";
import SentCampaignsListComponent from "@/components/ui/marketing/campaignBuilder/SentCampaignsListComponent";
import PageHeader from "@/components/ui/PageHeader";

const EmailsPage = () => {
  return (
    <Content>
      <PageHeader title="Marketing Emails" showBreadcrumb />
      <SentCampaignsListComponent />
    </Content>
  );
};

export default EmailsPage;
