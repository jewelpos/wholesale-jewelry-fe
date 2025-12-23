import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import PurchaseOrderForm from "@/components/ui/purchase/new/PurchaseOrderForm";

const EditPurchaseOrder = () => {
  return (
    <Content>
      <PageHeader title="Edit purchase order" showBreadcrumb />
      <PurchaseOrderForm />
    </Content>
  );
};

export default EditPurchaseOrder;
