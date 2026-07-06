import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import SalesOrderForm from "@/components/ui/sales/salesOrderForm/SalesOrderForm";

const NewSalesOrderPage = () => {
  return (
    <Content>
      <PageHeader title="Create Sales Order" showBreadcrumb />
      <SalesOrderForm />
    </Content>
  );
};

export default NewSalesOrderPage;
