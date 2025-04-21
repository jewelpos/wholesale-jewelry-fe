import Content from "@/components/layout/Content";
import CustomerForm from "@/components/ui/customers/customerForm/CustomerForm";
import PageHeader from "@/components/ui/PageHeader";

const NewCustomer = () => {
  return (
    <Content>
      <PageHeader title="Add new customer" showBreadcrumb />
      <CustomerForm />
    </Content>
  );
};

export default NewCustomer;
