import BackButton from "@/components/ui/BackButton";
import InfoHeader from "@/components/ui/InfoHeader";
import CreateOutletForm from "@/components/ui/outlet/CreateOutletForm";
import PageHeader from "@/components/ui/PageHeader";

const CreateStore = () => {
  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="row">
            <div className="col-md-12">
              <CreateOutletForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
