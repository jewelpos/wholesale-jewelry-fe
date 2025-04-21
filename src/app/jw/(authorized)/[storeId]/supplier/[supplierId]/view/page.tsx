import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SupplierForm from "@/components/ui/supplier/supplierForm/SupplierForm";

const ViewSupplier = () => {
  return (
    <Content>
      <PageHeader title="Edit supplier" showBreadcrumb />
      <SupplierForm disableField />
    </Content>
  );
};

export default ViewSupplier;
