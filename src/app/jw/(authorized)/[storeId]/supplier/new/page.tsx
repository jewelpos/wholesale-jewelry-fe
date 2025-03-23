import PageHeader from "@/components/ui/PageHeader";
import NewSupplierForm from "@/components/ui/supplier/newSupplier/NewSupplierForm";

const NewSupplier = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <div className="content">
          <PageHeader title="New Supplier" para="New Supplier" showBreadcrumb />
          <NewSupplierForm />
        </div>
      </div>
    </div>
  );
};

export default NewSupplier;
