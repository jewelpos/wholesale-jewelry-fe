import BackButton from "@/components/ui/BackButton";
import InfoHeader from "@/components/ui/InfoHeader";
import CreateOutletForm from "@/components/ui/outlet/CreateOutletForm";

const CreateStore = () => {
  return (
    <div>
      <div className="page-wrapper  cardhead">
        <div className="container mt-4">
          <BackButton />
        </div>
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
