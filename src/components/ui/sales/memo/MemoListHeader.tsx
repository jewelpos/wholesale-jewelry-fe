"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

interface MemoListHeaderProps {
  selectedMemoNumbers: number[];
  onPrintMemo: () => void;
  onEmailMemo: () => void;
  onExport: () => void;
}

const MemoListHeader = ({
  selectedMemoNumbers,
  onPrintMemo,
  onEmailMemo,
  onExport,
}: MemoListHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();
  const { basePath } = useDefaultRoute();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => {
      const rank = (btn: MenuAction): number => {
        if (btn.actionname === "add_new_memo")  return 0;
        if (btn.actionname.includes("print"))   return 10000;
        if (btn.actionname.includes("email"))   return 10001;
        if (btn.actionname.includes("export"))  return 10002;
        return btn.actionorder;
      };
      return rank(a) - rank(b);
    })
    .map((btn: MenuAction): ActionDef => {
      const isPrint  = btn.actionname.includes("print");
      const isExport = btn.actionname.includes("export");
      const isEmail  = btn.actionname.includes("email");
      const isActionBtn     = isPrint || isExport || isEmail;
      const isAddNewMemo    = btn.actionname === "add_new_memo";
      const isAddMemoInvoice  = btn.actionname === "add_new_memo_invoice";
      const isAddCreditMemo   = btn.actionname === "add_new_credit_memo_invoice";

      const canCreateFromMemo   = selectedMemoNumbers.length === 1;
      const selectionDisabled   = selectedMemoNumbers.length === 0 && (isPrint || isEmail);
      const createFromMemoDisabled = (isAddMemoInvoice || isAddCreditMemo) && !canCreateFromMemo;
      const disabled = selectionDisabled || createFromMemoDisabled;

      const href = isActionBtn
        ? "#"
        : isAddNewMemo
          ? `${basePath}/sales/new_memo`
          : isAddMemoInvoice && canCreateFromMemo
            ? `${basePath}/sales/invoice_from_memo/${selectedMemoNumbers[0]}`
            : isAddCreditMemo && canCreateFromMemo
              ? `${basePath}/sales/invoice_from_memo/${selectedMemoNumbers[0]}?credit=1`
              : (isAddMemoInvoice || isAddCreditMemo)
                ? "#"
                : `${currentPath}/new`;

      const onClick = isActionBtn
        ? (e: React.MouseEvent) => {
            e.preventDefault();
            if (disabled) return;
            if (isExport) { onExport(); return; }
            if (isEmail)  { onEmailMemo(); return; }
            onPrintMemo();
          }
        : undefined;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href,
        onClick,
        disabled,
        keepOnMobile: isAddNewMemo,
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

export default MemoListHeader;
