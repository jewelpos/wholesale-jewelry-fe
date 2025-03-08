import MainHomeComponent from "@/components/ui/home/MainHomeComponent";

const Home = async () => {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <MainHomeComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
