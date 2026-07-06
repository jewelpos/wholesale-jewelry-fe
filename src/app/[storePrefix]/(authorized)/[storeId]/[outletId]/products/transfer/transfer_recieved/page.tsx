import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import InventoryTransferReceiveForm from "@/components/ui/products/transfer/receiveTransfer/InventoryTransferReceiveForm";

const TransferRecievedPage = () => {
  return (
    <Content>
      <PageHeader title="Receive Transfer" showBreadcrumb />
      <InventoryTransferReceiveForm />
    </Content>
  );
};

export default TransferRecievedPage;
