import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import InventoryTransferForm from "@/components/ui/products/transfer/newTransfer/InventoryTransferForm";

const NewTransferPage = () => {
  return (
    <Content>
      <PageHeader title="New Transfer" showBreadcrumb />
      <InventoryTransferForm />
    </Content>
  );
};

export default NewTransferPage;
