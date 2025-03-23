import BalanceAgingComponent from "@/components/ui/customers/balanceAging/BalanceAgingComponent";
import PageHeader from "@/components/ui/PageHeader";

const BalanceAging = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <BalanceAgingComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceAging;
