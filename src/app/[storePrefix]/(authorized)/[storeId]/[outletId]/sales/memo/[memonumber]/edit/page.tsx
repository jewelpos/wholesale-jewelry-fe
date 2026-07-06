import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const EditMemoPage = async ({ params }: { params: Promise<{ memonumber: string }> }) => {
  const { memonumber: memonumberParam } = await params;
  const memonumber = parseInt(memonumberParam, 10);
  return (
    <Content>
      <PageHeader title={`Edit Memo #${memonumber}`} showBreadcrumb />
      <SalesInvoiceForm mode="NEW_INVOICE" documentType="MEMO" viewInvoicenumber={memonumber} />
    </Content>
  );
};

export default EditMemoPage;
