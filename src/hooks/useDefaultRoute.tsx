import { getEnvironmentConfig } from "@/lib/config/environment";
import { useParams } from "next/navigation";

const useDefaultRoute = () => {
  const { storeId, outletId } = useParams();
  const config = getEnvironmentConfig();
  const basePath = storeId
    ? `${config.basePath}/${storeId}/${outletId}`
    : `${config.basePath}`;

  const homePagePath = `${basePath}/home`;

  return {
    basePath,
    homePagePath,
  };
};

export default useDefaultRoute;
