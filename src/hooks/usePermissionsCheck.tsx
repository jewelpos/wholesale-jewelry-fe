import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppSelector } from "@/lib/store/hook";
import { MenuChild, Menus } from "@/types/permissions";

function findRoutePermission(
  currentPath: string,
  routes: Menus | MenuChild[],
  parentUrl: string
): boolean {
  if (!routes || routes.length === 0) {
    return true;
  }
  for (const route of routes) {
    let menuUrl: string = route.menuurl;
    if (parentUrl) {
      menuUrl = `${parentUrl}${route.menuurl}`;
    }
    // Grant access if this menu entry is an exact match OR a path prefix.
    // This covers dynamic segments (e.g. /customers/123/view) — the segment
    // after the module root cannot be in the DB since it's a record ID.
    // Backend API guards enforce what data the user can actually retrieve.
    if (currentPath === menuUrl || currentPath.startsWith(menuUrl + "/")) {
      return true;
    }
    // Also recurse into children so deeper fixed paths still work
    if (route.children && route.children.length > 0 && currentPath.startsWith(menuUrl)) {
      if (findRoutePermission(currentPath, route.children, menuUrl)) return true;
    }
  }
  return false;
}

// Strips the dynamic /{prefix}/{storeId}/{outletId} segment so the remaining
// path can be matched against DB menu URLs like "/customers", "/sales/invoices".
// Only handles outlet-scoped routes. Non-outlet routes (e.g. /jw/home) return
// the original pathname unchanged and are handled separately below.
function normalizePathForPermission(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length >= 3 &&
    /^\d+$/.test(segments[1]) &&
    /^\d+$/.test(segments[2])
  ) {
    const rest = segments.slice(3).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

// Non-outlet system routes live at /{storePrefix}/home and /{storePrefix}/store/create.
// The store prefix makes DB-matching impossible here, so we match by suffix.
// Every authenticated user can access these regardless of role.
const NON_OUTLET_SUFFIXES = ["/home", "/store/create"];

export function usePermissionCheck() {
  const router = useRouter();
  const availableRoutes = useAppSelector(
    (state) => state.user.data?.permissions?.menus
  ) as Menus | MenuChild[];

  useEffect(() => {
    const raw = window.location.pathname;

    // Allow non-outlet system pages for all authenticated users
    if (NON_OUTLET_SUFFIXES.some((s) => raw.endsWith(s))) return;

    const currentPath = normalizePathForPermission(raw);
    const hasPermission = findRoutePermission(currentPath, availableRoutes, "");

    if (!hasPermission) {
      router.push("/404");
    }
  }, [router, availableRoutes]);
}
