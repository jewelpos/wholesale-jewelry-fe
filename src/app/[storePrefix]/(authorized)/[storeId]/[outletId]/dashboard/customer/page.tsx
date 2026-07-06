import CustomerDashboard from "@/components/ui/dashboard/customer/CustomerDashboard";

const CustomerDashboardPage = () => {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <CustomerDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
