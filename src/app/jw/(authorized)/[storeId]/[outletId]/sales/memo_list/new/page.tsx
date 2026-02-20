import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const NewMemoPage = () => {
  return (
    <Content>
      <PageHeader title="Create Memo" showBreadcrumb />
      <SalesInvoiceForm mode="NEW_INVOICE" documentType="MEMO" />
    </Content>
  );
};

export default NewMemoPage;
