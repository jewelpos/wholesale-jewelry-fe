import BackButton from "@/components/ui/BackButton";
import InfoHeader from "@/components/ui/InfoHeader";
import AddUserForm from "@/components/ui/users/AddUserForm";

const AddUser = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <div className="content">
          <div className="container-fluid p-lg-5 p-md-2">
            <div className="container-md">
              <div className="row">
                <div className="col-md-12">
                  <BackButton />
                  <div className="page-header">
                    <div className="add-item d-flex">
                      <div className="page-title">
                        <h1>Add a user</h1>
                        <h6 className="mt-3">
                          Add a user and their permissions
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <AddUserForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
