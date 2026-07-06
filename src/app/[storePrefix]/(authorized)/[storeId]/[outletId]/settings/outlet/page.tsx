import Content from "@/components/layout/Content";
import EditOutletForm from "@/components/ui/outlet/EditOutletForm";

const EditOutletPage = () => {
  return (
    <Content>
      <div className="page-header">
        <div className="page-title">
          <h4>Edit Outlet</h4>
          <h6>Update outlet information</h6>
        </div>
      </div>
      <EditOutletForm />
    </Content>
  );
};

export default EditOutletPage;
