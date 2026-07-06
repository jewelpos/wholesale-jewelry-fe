"use client";

import Content from "@/components/layout/Content";
import ProductDrawer from "@/components/ui/products/productView/ProductDrawer";
import { useParams, useRouter } from "next/navigation";

const ViewProduct = () => {
  const { storeId: storeIdParam, outletId: outletIdParam, itemcode } = useParams();
  const router = useRouter();
  const storeId = parseInt(storeIdParam as string, 10);
  const outletId = parseInt(outletIdParam as string, 10);

  return (
    <Content>
      <ProductDrawer
        itemcode={itemcode as string}
        storeId={storeId}
        outletId={outletId}
        onClose={() => router.back()}
        mode="page"
      />
    </Content>
  );
};

export default ViewProduct;
