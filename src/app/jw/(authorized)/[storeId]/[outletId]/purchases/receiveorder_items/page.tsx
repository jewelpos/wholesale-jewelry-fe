
import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import ReceivePurchaseOrderForm from "@/components/ui/purchase/receive/ReceivePurchaseOrderForm";

const ReceiveOrderItemsPage = () => {
  return (
    <Content>
      <PageHeader title="Receive purchase order" showBreadcrumb />
      <ReceivePurchaseOrderForm />
    </Content>
  );
};

export default ReceiveOrderItemsPage;
