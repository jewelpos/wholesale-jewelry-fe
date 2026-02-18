import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const NewSalesInvoice = () => {
  return (
    <Content>
      <PageHeader title="Create Invoice" showBreadcrumb />
      <SalesInvoiceForm mode="NEW_INVOICE" />
    </Content>
  );
};

export default NewSalesInvoice;
