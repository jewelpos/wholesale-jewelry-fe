import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import CreateInvoiceFromMemoForm from "@/components/ui/sales/memo/CreateInvoiceFromMemoForm";

const CreateInvoiceFromMemoPage = () => {
  return (
    <Content>
      <PageHeader title="Create Invoice From Memo" showBreadcrumb />
      <CreateInvoiceFromMemoForm />
    </Content>
  );
};

export default CreateInvoiceFromMemoPage;
