import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import InvoiceFromMemoForm from "@/components/ui/sales/invoiceFromMemoForm/InvoiceFromMemoForm";

const InvoiceFromMemoPage = async ({ params }: { params: Promise<{ memonumber: string }> }) => {
  const { memonumber: memonumberParam } = await params;
  const memonumber = parseInt(memonumberParam, 10);
  return (
    <Content>
      <PageHeader title={`Create Invoice from Memo #${memonumber}`} showBreadcrumb />
      <InvoiceFromMemoForm memonumber={memonumber} />
    </Content>
  );
};

export default InvoiceFromMemoPage;
