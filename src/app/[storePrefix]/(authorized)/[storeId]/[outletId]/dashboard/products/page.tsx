import ProductDashboard from "@/components/ui/dashboard/products/ProductDashboard";

const ProductDashboardPage = () => {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <ProductDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboardPage;
