import BackButton from "@/components/ui/BackButton";
import InfoHeader from "@/components/ui/InfoHeader";
import PageHeader from "@/components/ui/PageHeader";
import AddUserButton from "@/components/ui/user/AddUserButton";
import AddUserForm from "@/components/ui/users/AddUserForm";

const AddUser = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <div className="content">
          <PageHeader title="Add user" para="Add user" showBreadcrumb />
          <AddUserForm />
        </div>
      </div>
    </div>
  );
};

export default AddUser;
