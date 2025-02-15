import BackButton from "@/components/ui/BackButton";
import InfoHeader from "@/components/ui/InfoHeader";
import AddStore from "@/components/ui/store/AddStore";

const CreateStore = () => {
  return (
    <div>
      <div className="page-wrapper cardhead">
        <div className="container mt-4">
          <BackButton />
        </div>
        <InfoHeader
          title="Create a store."
          para="Create your store, and  details."
        />
        <div className="container">
          {/* <Breadcrumb /> */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Store info</h5>
                </div>
                <AddStore />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
