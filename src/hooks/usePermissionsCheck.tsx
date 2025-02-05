import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppSelector } from "@/lib/store/hook";
import { MenuChild, Menus } from "@/types/permissions";

function findRoutePermission(
  currentPath: string,
  routes: Menus | MenuChild[],
  parentUrl: string
): boolean {
  if (!routes) {
    return true;
  }
  for (const route of routes) {
    let menuUrl: string = route.menuurl;
    if (parentUrl) {
      menuUrl = `${parentUrl}${route.menuurl}`;
    }
    if (currentPath.startsWith(menuUrl)) {
      if (currentPath === menuUrl) {
        return true;
      }
      if (route.children && currentPath.length > menuUrl.length) {
        return findRoutePermission(currentPath, route?.children, menuUrl);
      }
    }
  }
  return true;
}

export function usePermissionCheck() {
  const router = useRouter();
  const availableRoutes = useAppSelector(
    (state) => state.user.data?.permissions?.menus
  );

  useEffect(() => {
    const currentPath = window.location.pathname;
    const hasPermission = findRoutePermission(currentPath, availableRoutes, "");

    if (!hasPermission) {
      router.push("/404");
    }
  }, [router, availableRoutes]);
}
