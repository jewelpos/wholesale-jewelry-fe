import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const EditInvoicePage = async ({ params }: { params: Promise<{ invoicenumber: string }> }) => {
  const { invoicenumber: invoicenumberParam } = await params;
  const invoicenumber = parseInt(invoicenumberParam, 10);
  return (
    <Content>
      <PageHeader title={`Edit Invoice #${invoicenumber}`} showBreadcrumb />
      <SalesInvoiceForm mode="NEW_INVOICE" documentType="INVOICE" viewInvoicenumber={invoicenumber} invoiceId={invoicenumber} />
    </Content>
  );
};

export default EditInvoicePage;
