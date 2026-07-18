"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

interface LedgerActivityHeaderProps {
  onPrint?: () => void;
  onExport?: () => void;
}

const LedgerActivityHeader = ({ onPrint, onExport }: LedgerActivityHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => {
      const isPrint  = btn.actionname.includes("print");
      const isExport = btn.actionname.includes("export");
      const isModal  = isPrint || isExport;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: isModal ? "#" : `${currentPath}/new`,
        onClick: isPrint
          ? (e: React.MouseEvent) => { e.preventDefault(); onPrint?.(); }
          : isExport
            ? (e: React.MouseEvent) => { e.preventDefault(); onExport?.(); }
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
};

export default LedgerActivityHeader;
