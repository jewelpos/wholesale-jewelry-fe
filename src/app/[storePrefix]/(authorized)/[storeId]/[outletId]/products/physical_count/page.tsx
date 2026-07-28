import { redirect } from "next/navigation";

const PhysicalCountIndexPage = async ({
  params,
}: {
  params: Promise<{ storePrefix: string; storeId: string; outletId: string }>;
}) => {
  const { storePrefix, storeId, outletId } = await params;
  redirect(`/${storePrefix}/${storeId}/${outletId}/products/physical_count/list`);
};

export default PhysicalCountIndexPage;
