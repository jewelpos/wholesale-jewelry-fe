import CustomerDetail from "@/components/ui/dashboard/customer/detail/CustomerDetail";

const CustomerDetailPage = () => {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <CustomerDetail />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
