import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import AddUserForm from "@/components/ui/users/AddUserForm";

const EditUser = () => {
  return (
    <Content>
      <PageHeader title="User" showBreadcrumb />
      <AddUserForm />
    </Content>
  );
};

export default EditUser;
