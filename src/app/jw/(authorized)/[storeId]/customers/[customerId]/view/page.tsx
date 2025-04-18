import Content from "@/components/layout/Content";
import CustomerForm from "@/components/ui/customers/customerForm/CustomerForm";

const ViewCustomer = () => {
  return (
    <Content showBreadcrumb={false} title="View customer">
      <CustomerForm disableField />
    </Content>
  );
};

export default ViewCustomer;
