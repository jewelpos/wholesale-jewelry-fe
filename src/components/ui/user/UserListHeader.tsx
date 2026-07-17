"use client";

import React from "react";
import PageHeader from "../PageHeader";
import useMenu from "@/hooks/useMenu";
import Link from "next/link";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import FeatherIcon from "../FeatherIcon";

const UserListHeader = () => {
  const { currentMenu, currentPath } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname ?? "Users"}
      subtitle={currentMenu?.permissiondescription ?? "User List"}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action?.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              return (
                <div className="page-btn d-none d-sm-block" key={btn.actionname}>
                  <Link
                    href={`${currentPath}/new`}
                    className={`btn btn-added ${btnColor}`}
                  >
                    {iconName && <FeatherIcon icon={iconName} />}
                    {btn.actiondisplayname}
                  </Link>
                </div>
              );
            })}
      </div>
    </PageHeader>
  );
};

export default UserListHeader;
