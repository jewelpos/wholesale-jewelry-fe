import AppliedPaymentsComponent from "@/components/ui/customers/appliedPayments/AppliedPaymentsComponent";
import PageHeader from "@/components/ui/PageHeader";

const AppliedPayments = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader
            title="Applied Payments"
            para="Applied Payments"
            showBreadcrumb
          />
          <div className="card table-list-card">
            <AppliedPaymentsComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppliedPayments;
