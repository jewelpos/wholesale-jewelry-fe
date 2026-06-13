"use client";

import Content from "@/components/layout/Content";
import ProductForm from "@/components/ui/products/productForm/ProductForm";
import PageHeader from "@/components/ui/PageHeader";
import { useRouter } from "next/navigation";

const ViewProduct = () => {
  const router = useRouter();
  return (
    <Content>
      <PageHeader title="View Product" showBreadcrumb />
      <ProductForm disableField />
      <div className="card sticky-footer">
        <div className="card-body">
          <div className="text-end">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => router.back()}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Content>
  );
};

export default ViewProduct;
