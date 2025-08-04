import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SupplierForm from "@/components/ui/supplier/supplierForm/SupplierForm";

const NewSupplier = () => {
  return (
    <Content>
      <PageHeader title="Add new supplier" showBreadcrumb />
      <SupplierForm />
    </Content>
  );
};

export default NewSupplier;
