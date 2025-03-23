import PageHeader from "@/components/ui/PageHeader";
import CategoryComponent from "@/components/ui/products/category/CategoryComponent";

const Categories = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <CategoryComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
