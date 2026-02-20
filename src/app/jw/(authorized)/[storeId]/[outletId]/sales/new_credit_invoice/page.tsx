import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const CreditSalesInvoice = () => {
  return (
    <Content>
      <PageHeader title="Credit Invoice" showBreadcrumb />
      <SalesInvoiceForm mode="CREDIT_INVOICE" />
    </Content>
  );
};

export default CreditSalesInvoice;
