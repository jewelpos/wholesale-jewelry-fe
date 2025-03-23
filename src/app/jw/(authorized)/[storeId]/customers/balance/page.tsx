import BalanceComponent from "@/components/ui/customers/balance/BalanceComponent";
import PageHeader from "@/components/ui/PageHeader";

const Balance = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <BalanceComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Balance;
