import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import InvoiceFromSOForm from "@/components/ui/sales/invoiceFromSOForm/InvoiceFromSOForm";

type Params = Promise<{ salesorderno: string }>;

const InvoiceFromOrderPage = async ({ params }: { params: Params }) => {
  const { salesorderno } = await params;
  return (
    <Content>
      <PageHeader title={`Create Invoice — SO #${salesorderno}`} showBreadcrumb />
      <InvoiceFromSOForm salesorderno={Number(salesorderno)} />
    </Content>
  );
};

export default InvoiceFromOrderPage;
