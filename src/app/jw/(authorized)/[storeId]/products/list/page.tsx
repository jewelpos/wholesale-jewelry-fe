import PageHeader from "@/components/ui/PageHeader";
import ProductsListComponent from "@/components/ui/products/list/ProductsListComponent";

const ProuctsList = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <ProductsListComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProuctsList;
