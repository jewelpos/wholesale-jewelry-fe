import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import InvoiceFromMemoForm from "@/components/ui/sales/invoiceFromMemoForm/InvoiceFromMemoForm";

const InvoiceFromMemoPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ memonumber: string }>;
  searchParams: Promise<{ credit?: string }>;
}) => {
  const { memonumber: memonumberParam } = await params;
  const { credit } = await searchParams;
  const memonumber = parseInt(memonumberParam, 10);
  const isCreditReturn = credit === "1";
  return (
    <Content>
      <PageHeader
        title={isCreditReturn ? `Credit Invoice from Memo #${memonumber}` : `Create Invoice from Memo #${memonumber}`}
        showBreadcrumb
      />
      <InvoiceFromMemoForm memonumber={memonumber} creditFromMemo={isCreditReturn} />
    </Content>
  );
};

export default InvoiceFromMemoPage;
