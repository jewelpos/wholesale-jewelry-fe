import PageHeader from "@/components/ui/PageHeader";
import SupplierListComponent from "@/components/ui/supplier/supplierList/SupplierListComponent";

const SupplierLedgerActivity = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader
            title="Supplier List"
            para="Supplier List"
            showBreadcrumb
          />
          <div className="card table-list-card">
            <SupplierListComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedgerActivity;
