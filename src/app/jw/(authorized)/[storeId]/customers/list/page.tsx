import CustomerListComponent from "@/components/ui/customers/customersList/CustomerListComponent";
import PageHeader from "@/components/ui/PageHeader";

const CustomersList = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <CustomerListComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersList;
