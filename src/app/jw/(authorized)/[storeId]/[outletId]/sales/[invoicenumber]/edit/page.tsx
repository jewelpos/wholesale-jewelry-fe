import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const EditInvoicePage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ invoicenumber: string }>;
  searchParams: Promise<{ credit?: string }>;
}) => {
  const { invoicenumber: invoicenumberParam } = await params;
  const { credit } = await searchParams;
  const invoicenumber = parseInt(invoicenumberParam, 10);
  const title = credit === "1"
    ? `Edit Credit Invoice #${invoicenumber}`
    : `Edit Invoice #${invoicenumber}`;
  return (
    <Content>
      <PageHeader title={title} showBreadcrumb />
      <SalesInvoiceForm mode="NEW_INVOICE" documentType="INVOICE" viewInvoicenumber={invoicenumber} invoiceId={invoicenumber} />
    </Content>
  );
};

export default EditInvoicePage;
