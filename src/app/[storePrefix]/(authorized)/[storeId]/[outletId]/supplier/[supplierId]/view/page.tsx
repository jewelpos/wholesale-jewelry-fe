"use client";

import Content from "@/components/layout/Content";
import SupplierDrawer from "@/components/ui/supplier/supplierView/SupplierDrawer";
import { useParams, useRouter } from "next/navigation";

const ViewSupplier = () => {
  const { storeId: storeIdParam, outletId: outletIdParam, supplierId } = useParams();
  const router = useRouter();
  const storeId = parseInt(storeIdParam as string, 10);
  const outletId = parseInt(outletIdParam as string, 10);

  return (
    <Content>
      <SupplierDrawer
        supplierId={parseInt(supplierId as string, 10)}
        storeId={storeId}
        outletId={outletId}
        onClose={() => router.back()}
        mode="page"
      />
    </Content>
  );
};

export default ViewSupplier;
