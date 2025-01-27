import CreateStoreForm from "@/components/ui/store/CreateStoreForm";

const CreateStore = () => {
  return (
    <div>
      <div className="page-wrapper cardhead">
        <div className="content container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Create Store</h5>
                  <p>You need to create the store first</p>
                </div>
                <div className="card-body">
                  <CreateStoreForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
