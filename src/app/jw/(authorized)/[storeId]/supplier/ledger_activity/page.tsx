import PageHeader from "@/components/ui/PageHeader";
import SupplierLedgerActitvityComponent from "@/components/ui/supplier/supplierLedgerActitvity/SupplierLedgerActitvityComponent";

const SupplierLedgerActivity = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <SupplierLedgerActitvityComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedgerActivity;
