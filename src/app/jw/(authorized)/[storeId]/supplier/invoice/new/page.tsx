import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SupplierInvoiceForm from "@/components/ui/supplier/invoice/new/SupplierInvoiceForm";

const NewSupplierInvoice = () => {
  return (
    <Content>
      <PageHeader title="Add new supplier invoice" showBreadcrumb />
      <SupplierInvoiceForm />
    </Content>
  );
};

export default NewSupplierInvoice;
