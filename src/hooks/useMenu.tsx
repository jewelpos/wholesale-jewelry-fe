import { useAppSelector } from "@/lib/store/hook";
import { usePathname } from "next/navigation";
import useDefaultRoute from "./useDefaultRoute";
import { useMemo } from "react";

const useMenu = () => {
  const user = useAppSelector((state) => state.user.data);
  const menus = user?.permissions?.menus;
  const pathname = usePathname();
  const { basePath } = useDefaultRoute();
  const path = pathname.replace(basePath, "");
  const parentPath = "/" + path.split("/")[1];
  const childPath = "/" + path.split("/")[2];
  const currentPath = `${basePath}${parentPath}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMenu: any = useMemo(() => {
    let selectedMenu: any;
    menus?.forEach((menu) => {
      if (menu.menuurl === parentPath) {
        selectedMenu = menu.children?.find(
          (child) => child.menuurl === childPath
        );
      }
    });
    // Deduplicate actions by actionname — duplicate storemenuactions rows in the DB
    // would otherwise cause React "two children with the same key" warnings.
    if (selectedMenu?.action?.length) {
      const seen = new Set<string>();
      selectedMenu = {
        ...selectedMenu,
        action: selectedMenu.action.filter((a: any) => {
          if (seen.has(a.actionname)) return false;
          seen.add(a.actionname);
          return true;
        }),
      };
    }
    return selectedMenu;
  }, [menus, parentPath, childPath]);

  return { currentMenu, currentPath, basePath };
};

export default useMenu;
