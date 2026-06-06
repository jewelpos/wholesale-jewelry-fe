"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import Link from "next/link";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";
import useDefaultRoute from "@/hooks/useDefaultRoute";

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
  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action?.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => {
              // print/email/export are always last in that order;
              // all other buttons (create actions) keep their DB actionorder
              const rank = (btn: MenuAction): number => {
                if (btn.actionname === "add_new_memo")   return 0;
                if (btn.actionname.includes("print"))    return 10000;
                if (btn.actionname.includes("email"))    return 10001;
                if (btn.actionname.includes("export"))   return 10002;
                return btn.actionorder;
              };
              return rank(a) - rank(b);
            })
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isPrintButton = btn.actionname.includes("print");
              const isExportButton = btn.actionname.includes("export");
              const isEmailButton = btn.actionname.includes("email");
              const isActionButton = isPrintButton || isExportButton || isEmailButton;

              const isAddNewMemoAction = btn.actionname === "add_new_memo";
              const isAddNewMemoInvoiceAction = btn.actionname === "add_new_memo_invoice";

              // Any unrecognised create button (e.g. Credit Invoice from Memo) requires ≥1 selection
              const isKnownButton =
                isAddNewMemoAction || isAddNewMemoInvoiceAction || isActionButton;
              const unknownCreateDisabled = !isKnownButton && selectedMemoNumbers.length === 0;

              // Export is always enabled; print and email require a selection
              const selectionDisabled =
                selectedMemoNumbers.length === 0 && (isPrintButton || isEmailButton);
              const canCreateInvoiceFromMemo = selectedMemoNumbers.length === 1;
              const createInvoiceDisabled = isAddNewMemoInvoiceAction && !canCreateInvoiceFromMemo;

              const disabledButton = selectionDisabled || createInvoiceDisabled || unknownCreateDisabled;

              const href = isActionButton
                ? "#"
                : isAddNewMemoAction
                  ? `${basePath}/sales/new_memo`
                  : isAddNewMemoInvoiceAction && canCreateInvoiceFromMemo
                    ? `${basePath}/sales/invoice_from_memo/${selectedMemoNumbers[0]}`
                    : isAddNewMemoInvoiceAction
                      ? "#"
                    : `${currentPath}/new`;

              const handleClick = (e: React.MouseEvent) => {
                if (disabledButton) {
                  e.preventDefault();
                  return;
                }

                if (isActionButton) {
                  e.preventDefault();
                  if (isExportButton) { onExport(); return; }
                  if (isEmailButton) { onEmailMemo(); return; }
                  onPrintMemo();
                }
              };

              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={href}
                    onClick={handleClick}
                    className={`btn btn-added ${btnColor} ${
                      disabledButton ? "disabled" : ""
                    }`}
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

export default MemoListHeader;
