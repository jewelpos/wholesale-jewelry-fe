import Content from "@/components/layout/Content";
import PageHeader from "@/components/ui/PageHeader";
import ProductForm from "@/components/ui/products/productForm/ProductForm";

const NewProduct = () => {
  return (
    <Content>
      <PageHeader title="Add new product" showBreadcrumb />
      <ProductForm />
    </Content>
  );
};

export default NewProduct;
