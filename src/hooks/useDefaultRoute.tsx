import { getEnvironmentConfig } from "@/lib/config/environment";
import { useAppSelector } from "@/lib/store/hook";
import { useParams } from "next/navigation";

const useDefaultRoute = () => {
  const { storeId, outletId } = useParams();
  const config = getEnvironmentConfig();
  const stores = useAppSelector((state) => state.stores.data);
  const currentStore = stores?.find(
    (s) => String(s.storeid) === String(storeId)
  );
  const prefix = currentStore?.routeprefix ?? (config.basePath ?? "jw").replace(/^\//, "");
  const basePath = storeId
    ? `/${prefix}/${storeId}/${outletId}`
    : `/${prefix}`;

  const homePagePath = `${basePath}/home`;

  return {
    basePath,
    homePagePath,
  };
};

export default useDefaultRoute;
