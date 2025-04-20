import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SupplierForm from "@/components/ui/supplier/supplierForm/SupplierForm";

const EditSupplier = () => {
  return (
    <Content>
      <PageHeader title="Edit supplier" showBreadcrumb />
      <SupplierForm />
    </Content>
  );
};

export default EditSupplier;
