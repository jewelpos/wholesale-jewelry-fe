import LedgerActivityComponent from "@/components/ui/customers/ledgerActivity/LedgerActivityComponent";
import PageHeader from "@/components/ui/PageHeader";

const LedgerActivity = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <LedgerActivityComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerActivity;
