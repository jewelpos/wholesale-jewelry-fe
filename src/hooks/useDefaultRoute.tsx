import { getEnvironmentConfig } from "@/lib/config/environment";
import { useParams } from "next/navigation";

const useDefaultRoute = () => {
  const { storeId } = useParams();
  const config = getEnvironmentConfig();
  const basePath = storeId
    ? `${config.basePath}/${storeId}`
    : `${config.basePath}`;

  const homePagePath = `${basePath}/home`;

  return {
    basePath,
    homePagePath,
  };
};

export default useDefaultRoute;
