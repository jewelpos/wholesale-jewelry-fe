"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

interface ExpenseListHeaderProps {
  onAdd: () => void;
  addDisabled?: boolean;
  onPrint: () => void;
  printDisabled?: boolean;
}

const ExpenseListHeader: React.FC<ExpenseListHeaderProps> = ({ onAdd, addDisabled, onPrint, printDisabled }) => {
  const { currentMenu } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => {
      const isAdd = btn.actionname.includes("add");
      const isPrint = btn.actionname.includes("print");
      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: "#",
        disabled: isAdd ? addDisabled : isPrint ? printDisabled : false,
        onClick: isAdd
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              onAdd();
            }
          : isPrint
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              onPrint();
            }
          : undefined,
      };
    });

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Expense List"}
      subtitle={currentMenu?.permissiondescription || "Manage your business expenses"}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
};

export default ExpenseListHeader;
