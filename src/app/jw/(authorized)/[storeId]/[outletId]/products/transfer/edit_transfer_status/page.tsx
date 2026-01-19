import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import InventoryTransferStatusForm from "@/components/ui/products/transfer/editTransferStatus/InventoryTransferStatusForm";

const EditTransferStatusPage = () => {
  return (
    <Content>
      <PageHeader title="Edit Transfer Status" showBreadcrumb />
      <InventoryTransferStatusForm />
    </Content>
  );
};

export default EditTransferStatusPage;
