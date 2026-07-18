"use client";

import React from "react";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import PageHeader from "../../PageHeader";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

export default function ProductActivitiesHeader({ onExport }: { onExport: () => void }) {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => {
      const isExport = btn.actionname.includes("export");
      const isModal  = btn.actionname.includes("print") || isExport;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: isModal ? "#" : `${currentPath}/new`,
        onClick: isModal
          ? (e: React.MouseEvent) => { e.preventDefault(); if (isExport) onExport(); }
          : undefined,
      };
    });

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
}
