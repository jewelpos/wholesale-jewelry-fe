import Link from "next/link";
import Content from "@/components/layout/Content";
import CampaignBuilderComponent from "@/components/ui/marketing/campaignBuilder/CampaignBuilderComponent";
import PageHeader from "@/components/ui/PageHeader";

const NewMarketingCampaign = () => {
  return (
    <Content>
      <PageHeader
        title="New Marketing Campaign"
        showBreadcrumb
        rightSection={<Link href="../emails" className="btn btn-outline-secondary btn-sm">Sent Campaigns</Link>}
      />
      <CampaignBuilderComponent />
    </Content>
  );
};

export default NewMarketingCampaign;
