import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const NewCreditMemoPage = () => {
  return (
    <Content>
      <PageHeader title="Create Credit Memo" showBreadcrumb />
      <SalesInvoiceForm mode="CREDIT_INVOICE" documentType="MEMO" />
    </Content>
  );
};

export default NewCreditMemoPage;
