import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import CreateCreditInvoiceFromMemoForm from "@/components/ui/sales/memo/CreateCreditInvoiceFromMemoForm";

const CreateCreditInvoiceFromMemoPage = () => {
  return (
    <Content>
      <PageHeader title="Create Credit Invoice From Memo" showBreadcrumb />
      <CreateCreditInvoiceFromMemoForm />
    </Content>
  );
};

export default CreateCreditInvoiceFromMemoPage;
