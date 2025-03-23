import PageHeader from "@/components/ui/PageHeader";
import AddStore from "@/components/ui/store/AddStore";

const CreateStore = () => {
  return (
    <div>
      <div className="page-wrapper  ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="row">
            <div className="col-md-12">
              <AddStore />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
