import { redirect } from "next/navigation";

const PhysicalCountIndexPage = async ({
  params,
}: {
  params: Promise<{ storeId: string; outletId: string }>;
}) => {
  const { storeId, outletId } = await params;
  redirect(`/jw/${storeId}/${outletId}/products/physical_count/list`);
};

export default PhysicalCountIndexPage;
