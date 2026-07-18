"use client";

import React from "react";
import PageHeader from "../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../MobileActionsDropdown";

const UserListHeader = () => {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => ({
      key: btn.actionname,
      label: btn.actiondisplayname,
      icon: renderActionButtonIconName(btn.actionname) || undefined,
      colorClass: renderActionButtonColor(btn.actionname),
      href: `${currentPath}/new`,
    }));

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname ?? "Users"}
      subtitle={currentMenu?.permissiondescription ?? "User List"}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
};

export default UserListHeader;
