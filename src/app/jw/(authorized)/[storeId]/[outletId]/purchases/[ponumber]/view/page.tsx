import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import PurchaseOrderForm from "@/components/ui/purchase/new/PurchaseOrderForm";

const ViewPurchaseOrder = () => {
  return (
    <Content>
      <PageHeader title="View purchase order" showBreadcrumb />
      <PurchaseOrderForm disableField />
    </Content>
  );
};

export default ViewPurchaseOrder;
