
import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import ReturnPurchaseOrderForm from "@/components/ui/purchase/return/ReturnPurchaseOrderForm";

const ReturnOrder = () => {
  return (
    <Content>
      <PageHeader title="Return order" showBreadcrumb />
      <ReturnPurchaseOrderForm />
    </Content>
  );
};

export default ReturnOrder;

