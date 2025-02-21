import InfoHeader from "@/components/ui/InfoHeader";
import AddUserButton from "@/components/ui/user/AddUserButton";
import UserComponent from "@/components/ui/user/UserComponent";
import Link from "next/link";
import { Filter, PlusCircle, Sliders } from "react-feather";
import Select from "react-select";

const Users = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <div className="content">
          <div className="container-fluid p-lg-5 p-md-2">
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <div className="page-header">
                    <div className="add-item d-flex">
                      <div className="page-title">
                        <h1>Users</h1>
                        <h6 className="mt-3">Manage Your Users</h6>
                      </div>
                    </div>
                    <div className="page-btn">
                      <AddUserButton />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card table-list-card">
                <div className="card-body">
                  <div className="table-top">
                    <div className="search-set">
                      <div className="search-input">
                        <input
                          type="text"
                          placeholder="Search"
                          className="form-control form-control-sm formsearch"
                        />
                        <Link href={""} className="btn btn-searchset">
                          <i data-feather="search" className="feather-search" />
                        </Link>
                      </div>
                    </div>
                    <div className="form-sort">
                      <Sliders className="info-img" />
                      {/* <Select
                        className="img-select"
                        classNamePrefix="react-select"
                        // options={oldandlatestvalue}
                        placeholder="Newest"
                      /> */}
                    </div>
                  </div>
                </div>
                <UserComponent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
