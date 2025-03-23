import PageHeader from "@/components/ui/PageHeader";
import AddUserButton from "@/components/ui/user/AddUserButton";
import UserComponent from "@/components/ui/user/UserComponent";
import Link from "next/link";

const Users = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <div className="card-body">
              <div className="tabs-set">
                <ul
                  className="nav nav-tabs justify-content-end"
                  id="myTab"
                  role="tablist"
                >
                  <li className="nav-item" role="presentation">
                    <AddUserButton />
                  </li>
                </ul>
              </div>
            </div>
            <UserComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
