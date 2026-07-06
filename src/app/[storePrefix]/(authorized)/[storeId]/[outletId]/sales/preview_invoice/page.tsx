import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesInvoiceFormV2 from "@/components/ui/sales/invoiceForm/SalesInvoiceFormV2";

const PreviewInvoiceV2 = () => {
  return (
    <Content>
      <PageHeader title="Create Invoice (V2 Preview)" showBreadcrumb />
      <SalesInvoiceFormV2 mode="NEW_INVOICE" />
    </Content>
  );
};

export default PreviewInvoiceV2;
