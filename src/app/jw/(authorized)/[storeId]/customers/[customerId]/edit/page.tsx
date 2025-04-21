import Content from "@/components/layout/Content";
import CustomerForm from "@/components/ui/customers/customerForm/CustomerForm";
import PageHeader from "@/components/ui/PageHeader";

const EditCustomer = () => {
  return (
    <Content>
      <PageHeader title="Edit customer" showBreadcrumb />
      <CustomerForm />
    </Content>
  );
};

export default EditCustomer;
