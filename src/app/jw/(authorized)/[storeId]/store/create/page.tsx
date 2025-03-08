import PageHeader from "@/components/ui/PageHeader";
import AddStore from "@/components/ui/store/AddStore";

const CreateStore = () => {
  return (
    <div>
      <div className="page-wrapper  ">
        <div className="content">
          <PageHeader
            title="Create your store"
            para="Set up your store effortlessly and start managing your products, services, and users seamlessly."
            showBreadcrumb
          />
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
