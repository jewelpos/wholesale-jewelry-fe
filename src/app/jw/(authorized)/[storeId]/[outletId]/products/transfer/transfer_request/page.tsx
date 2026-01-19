import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import InventoryTransferRequestForm from "@/components/ui/products/transfer/transferRequest/InventoryTransferRequestForm";

const TransferRequestPage = () => {
  return (
    <Content>
      <PageHeader title="Transfer Request" showBreadcrumb />
      <InventoryTransferRequestForm />
    </Content>
  );
};

export default TransferRequestPage;
