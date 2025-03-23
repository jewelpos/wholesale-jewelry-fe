import PageHeader from "@/components/ui/PageHeader";
import AddUserForm from "@/components/ui/users/AddUserForm";

const AddUser = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <div className="content">
          <PageHeader showBreadcrumb />
          <AddUserForm />
        </div>
      </div>
    </div>
  );
};

export default AddUser;
