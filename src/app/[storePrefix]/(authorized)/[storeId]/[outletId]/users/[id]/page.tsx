import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import AddUserForm from "@/components/ui/users/AddUserForm";
import BackButton from "@/components/ui/BackButton";

const EditUser = () => {
  return (
    <Content>
      <PageHeader title="User" showBreadcrumb rightSection={<BackButton />} />
      <AddUserForm />
    </Content>
  );
};

export default EditUser;
