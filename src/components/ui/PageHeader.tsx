"use client";

import React, { useMemo } from "react";
import Breadcrumb from "./Breadcrumb";
import Link from "next/link";
import { useAppSelector } from "@/lib/store/hook";
import { usePathname } from "next/navigation";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { MenuAction } from "@/types/permissions";
import { PlusCircle, Upload } from "react-feather";

type Props = {
  showBreadcrumb?: boolean;
  title?: string;
  subtitle?: string;
};

const PageHeader = ({ showBreadcrumb, title, subtitle }: Props) => {
  const user = useAppSelector((state) => state.user.data);
  const menus = user?.permissions?.menus;
  const pathname = usePathname();
  const { basePath } = useDefaultRoute();
  const path = pathname.replace(basePath, "");
  const parentPath = "/" + path.split("/")[1];
  const childPath = "/" + path.split("/")[2];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMenu: any = useMemo(() => {
    let selectedMenu;
    menus?.forEach((menu) => {
      if (menu.menuurl === parentPath) {
        selectedMenu = menu.children?.find(
          (child) => child.menuurl === childPath
        );
      }
    });
    return selectedMenu;
  }, [menus, parentPath, childPath]);

  return (
    <div className="page-header mb-1">
      <div className="add-item d-flex">
        <div className="page-title">
          <h4>{currentMenu?.permissiondisplayname || title || ""}</h4>
          {currentMenu?.permissiondescription && (
            <h6 className="mb-1">
              {currentMenu?.permissiondescription || subtitle || ""}
            </h6>
          )}
          {showBreadcrumb && <Breadcrumb />}
        </div>
      </div>
      {!!currentMenu?.action.length &&
        currentMenu.action.map((btn: MenuAction) => {
          if (btn.actionname.includes("add_new")) {
            return (
              <div className="page-btn" key={btn.actionname}>
                <Link
                  href={`${basePath}${parentPath}/new`}
                  className="btn btn-added"
                >
                  <PlusCircle className="me-2 iconsize" />
                  {btn.actiondisplayname}
                </Link>
              </div>
            );
          } else if (btn.actionname.includes("export")) {
            return (
              <div className="page-btn import" key={btn.actionname}>
                <Link
                  href={`${basePath}/supplier/new`}
                  className="btn btn-added btn-secondary"
                >
                  <Upload className="me-2 iconsize" />
                  {btn.actiondisplayname}
                </Link>
              </div>
            );
          }
          return (
            <div className="page-btn" key={btn.actionname}>
              <Link href={`${basePath}`} className="btn btn-added">
                {btn.actiondisplayname}
              </Link>
            </div>
          );
        })}
    </div>
  );
};

export default PageHeader;
