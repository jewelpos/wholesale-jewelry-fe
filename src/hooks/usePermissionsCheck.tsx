import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useAppSelector } from "@/lib/store/hook";

function findRoutePermission(currentPath: string, routes: any): boolean {
  for (const route of routes) {
    // Check if current path starts with the route path
    if (currentPath.startsWith(route.menuUrl)) {
      // If it's an exact match
      if (currentPath === route.menuUrl) {
        return true;
      }

      // If it has children and the path is longer, check children
      if (route.children && currentPath.length > route.menuUrl.length) {
        return findRoutePermission(currentPath, route?.children);
      }
    }
  }
  return false;
}

export function usePermissionCheck() {
  const router = useRouter();
  const availableRoutes = useAppSelector(
    (state) => state.user.data?.permissions[0]?.menus
  );

  useEffect(() => {
    const currentPath = window.location.pathname;
    const hasPermission = findRoutePermission(currentPath, availableRoutes);

    if (!hasPermission) {
      router.push("/404");
    }
  }, [router, availableRoutes]);
}
