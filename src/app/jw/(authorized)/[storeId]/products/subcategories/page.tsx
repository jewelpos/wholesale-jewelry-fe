import PageHeader from "@/components/ui/PageHeader";
import SubCategoryComponent from "@/components/ui/products/subCategory/SubCategoryComponent";

const SubCategories = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader title="Sub category" para="Sub category" showBreadcrumb />
          <div className="card table-list-card">
            <SubCategoryComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubCategories;
