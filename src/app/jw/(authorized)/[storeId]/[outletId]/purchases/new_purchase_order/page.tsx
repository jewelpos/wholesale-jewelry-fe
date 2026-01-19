import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import PurchaseOrderForm from "@/components/ui/purchase/new/PurchaseOrderForm";

const NewPurchaseOrder = () => {
  return (
    <Content>
      <PageHeader title="Add new purchase order" showBreadcrumb />
      <PurchaseOrderForm />
    </Content>
  );
};

export default NewPurchaseOrder;
