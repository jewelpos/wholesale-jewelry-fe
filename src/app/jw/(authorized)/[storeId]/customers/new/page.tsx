import NewCustomerForm from "@/components/ui/customers/newCustomer/NewCustomerForm";
import PageHeader from "@/components/ui/PageHeader";

const NewCustomer = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <div className="content">
          <PageHeader title="New Customer" para="New Customer" showBreadcrumb />
          <NewCustomerForm />
        </div>
      </div>
    </div>
  );
};

export default NewCustomer;
