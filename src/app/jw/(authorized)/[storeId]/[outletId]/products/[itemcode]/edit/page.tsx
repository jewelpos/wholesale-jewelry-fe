import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import ProductForm from "@/components/ui/products/productForm/ProductForm";

const EditProduct = () => {
  return (
    <Content>
      <PageHeader title="Edit product" showBreadcrumb />
      <ProductForm />
    </Content>
  );
};

export default EditProduct;
