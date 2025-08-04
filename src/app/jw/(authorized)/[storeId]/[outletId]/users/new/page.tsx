import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import AddUserForm from "@/components/ui/users/AddUserForm";

const AddUser = () => {
  return (
    <Content>
      <PageHeader title="Add new user" showBreadcrumb />
      <AddUserForm />
    </Content>
  );
};

export default AddUser;
