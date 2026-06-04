import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const ViewMemoPage = async ({ params }: { params: Promise<{ memonumber: string }> }) => {
  const { memonumber: memonumberParam } = await params;
  const memonumber = parseInt(memonumberParam, 10);
  return (
    <Content>
      <PageHeader title={`View Memo #${memonumber}`} showBreadcrumb />
      <SalesInvoiceForm mode="NEW_INVOICE" documentType="MEMO" viewInvoicenumber={memonumber} readOnly />
    </Content>
  );
};

export default ViewMemoPage;
