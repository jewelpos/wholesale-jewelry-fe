import PageHeader from "@/components/ui/PageHeader";
import SalesListComponent from "@/components/ui/sales/salesList/SalesListComponent";

const SalesList = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader title="Sales list" para="Sales list" showBreadcrumb />
          <div className="card table-list-card">
            <SalesListComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesList;
