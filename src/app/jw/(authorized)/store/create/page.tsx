import Breadcrumb from "@/components/ui/Breadcrumb";
import InfoHeader from "@/components/ui/InfoHeader";
import CreateStoreOutletForm from "@/components/ui/store/CreateStoreOutletForm";

const CreateStore = () => {
  return (
    <div>
      <div className="main-wrapper m-header-store cardhead">
        <InfoHeader
          title="Create a store."
          para="Create your first store and details. Store name will be considered as your outlet name by default."
        />
        <div className="container">
          <CreateStoreOutletForm />
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
