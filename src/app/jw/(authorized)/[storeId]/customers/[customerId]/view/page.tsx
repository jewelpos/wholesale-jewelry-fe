import Content from "@/components/layout/Content";
import CustomerForm from "@/components/ui/customers/customerForm/CustomerForm";
import PageHeader from "@/components/ui/PageHeader";

const ViewCustomer = () => {
  return (
    <Content>
      <PageHeader title="View customer" showBreadcrumb />
      <CustomerForm disableField />
    </Content>
  );
};

export default ViewCustomer;
