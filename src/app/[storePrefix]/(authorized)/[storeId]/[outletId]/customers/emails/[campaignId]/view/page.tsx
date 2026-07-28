import Content from "@/components/layout/Content";
import CampaignDetailComponent from "@/components/ui/marketing/campaignBuilder/CampaignDetailComponent";
import PageHeader from "@/components/ui/PageHeader";

const CampaignDetailPage = () => {
  return (
    <Content>
      <PageHeader title="Campaign Detail" showBreadcrumb />
      <CampaignDetailComponent />
    </Content>
  );
};

export default CampaignDetailPage;
