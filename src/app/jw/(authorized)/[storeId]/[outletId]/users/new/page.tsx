import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import AddUserForm from "@/components/ui/users/AddUserForm";

const subtitle = (
  <>
    Default permissions for the selected role are pre-selected — add extras as needed.
    Permissions marked{" "}
    <span style={{ color: "#dc2626", fontWeight: 500 }}>Not available</span>
    {" "}cannot be granted for this role.
  </>
);

const AddUser = () => {
  return (
    <Content>
      <PageHeader
        title="Add new user"
        subtitle={subtitle}
        showBreadcrumb
      />
      <AddUserForm />
    </Content>
  );
};

export default AddUser;
