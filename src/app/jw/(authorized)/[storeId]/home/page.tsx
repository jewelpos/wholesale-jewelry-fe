import MainHomeComponent from "@/components/ui/home/MainHomeComponent";

const Home = async () => {
  return (
    <div>
      <div className="page-wrapper cardhead">
        <div className="container-fluid p-lg-5 p-md-2">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <MainHomeComponent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
