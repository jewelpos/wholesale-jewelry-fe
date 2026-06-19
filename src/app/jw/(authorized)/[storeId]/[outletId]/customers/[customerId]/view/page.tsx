"use client";

import Content from "@/components/layout/Content";
import CustomerDrawer from "@/components/ui/customers/customerView/CustomerDrawer";
import { useParams, useRouter } from "next/navigation";

const ViewCustomer = () => {
  const { storeId: storeIdParam, outletId: outletIdParam, customerId } = useParams();
  const router = useRouter();
  const storeId = parseInt(storeIdParam as string, 10);
  const outletId = parseInt(outletIdParam as string, 10);

  return (
    <Content>
      <CustomerDrawer
        customerId={parseInt(customerId as string, 10)}
        storeId={storeId}
        outletId={outletId}
        onClose={() => router.back()}
        mode="page"
      />
    </Content>
  );
};

export default ViewCustomer;
