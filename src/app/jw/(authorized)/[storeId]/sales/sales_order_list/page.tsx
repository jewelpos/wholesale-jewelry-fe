import PageHeader from "@/components/ui/PageHeader";
import SalesOrderListComponent from "@/components/ui/sales/salesOrderList/SalesOrderListComponent";

const SalesOrderList = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <SalesOrderListComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderList;
