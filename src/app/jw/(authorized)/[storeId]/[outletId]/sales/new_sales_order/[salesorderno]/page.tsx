import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesOrderForm from "@/components/ui/sales/salesOrderForm/SalesOrderForm";

const EditSalesOrderPage = ({ params }: { params: { salesorderno: string } }) => {
  const salesorderno = parseInt(params.salesorderno, 10);
  return (
    <Content>
      <PageHeader title={`Edit Sales Order #${salesorderno}`} showBreadcrumb />
      <SalesOrderForm salesorderno={salesorderno} />
    </Content>
  );
};

export default EditSalesOrderPage;
