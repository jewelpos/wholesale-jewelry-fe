import Content from "@/components/layout/Content";
import CustomerForm from "@/components/ui/customers/customerForm/CustomerForm";

const EditCustomer = () => {
  return (
    <Content showBreadcrumb={false} title="Edit customer">
      <CustomerForm />
    </Content>
  );
};

export default EditCustomer;
