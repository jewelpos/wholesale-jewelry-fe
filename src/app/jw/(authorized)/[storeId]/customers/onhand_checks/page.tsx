import OnHandChecksComponent from "@/components/ui/customers/onHandChecks/OnHandChecksComponent";
import PageHeader from "@/components/ui/PageHeader";

const OnHandChecks = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <OnHandChecksComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnHandChecks;
