import InfoHeader from "@/components/ui/InfoHeader";
import CreateOutletForm from "@/components/ui/outlet/CreateOutletForm";

const CreateStore = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <InfoHeader
          title="Create an outlet."
          para="Create your outlet with location"
        />
        <div className="container">
          <CreateOutletForm />
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
