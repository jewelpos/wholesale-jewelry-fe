import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesOrderForm from "@/components/ui/sales/salesOrderForm/SalesOrderForm";

const EditSalesOrderPage = async ({ params }: { params: Promise<{ salesorderno: string }> }) => {
  const { salesorderno: salesordernoParam } = await params;
  const salesorderno = parseInt(salesordernoParam, 10);
  return (
    <Content>
      <PageHeader title={`Edit Sales Order #${salesorderno}`} showBreadcrumb />
      <SalesOrderForm salesorderno={salesorderno} />
    </Content>
  );
};

export default EditSalesOrderPage;
