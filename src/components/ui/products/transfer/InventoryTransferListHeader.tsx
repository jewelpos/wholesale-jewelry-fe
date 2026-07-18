"use client";

import React from "react";
import useMenu from "@/hooks/useMenu";
import PageHeader from "../../PageHeader";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

const InventoryTransferListHeader = () => {
  const { currentMenu, currentPath } = useMenu();

  const sectionPath = `${currentPath}${currentMenu?.menuurl ?? ""}`;

  const resolveHref = (actionName: string) => {
    if (actionName.includes("add_transfer_recieved")) return `${sectionPath}/transfer_recieved`;
    if (actionName.includes("add_transfer_request"))  return `${sectionPath}/transfer_request`;
    if (actionName.includes("add_new_transfer"))      return `${sectionPath}/new_transfer`;
    if (actionName.includes("edit_transfer_status"))  return `${sectionPath}/edit_transfer_status`;
    return `${sectionPath}/new`;
  };

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => ({
      key: btn.actionname,
      label: btn.actiondisplayname,
      icon: renderActionButtonIconName(btn.actionname) || undefined,
      colorClass: renderActionButtonColor(btn.actionname),
      href: resolveHref(btn.actionname),
    }));

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Inventory Transfer"}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
};

export default InventoryTransferListHeader;
