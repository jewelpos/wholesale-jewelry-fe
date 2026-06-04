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
}

const MemoListHeader = ({
  selectedMemoNumbers,
  onPrintMemo,
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
              if (a.actionorder < b.actionorder) return -1;
              if (a.actionorder > b.actionorder) return 1;
              return 0;
            })
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isPrintExportButton =
                btn.actionname.includes("print") || btn.actionname.includes("export");

              const isAddNewMemoAction = btn.actionname === "add_new_memo";
              const isAddNewMemoReturnAction = btn.actionname === "add_new_memo_return";
              const isAddNewMemoInvoiceAction = btn.actionname === "add_new_memo_invoice";

              const printExportDisabled = selectedMemoNumbers.length === 0 && isPrintExportButton;
              const canCreateInvoiceFromMemo = selectedMemoNumbers.length === 1;
              const createInvoiceDisabled = isAddNewMemoInvoiceAction && !canCreateInvoiceFromMemo;

              const disabledButton =
                printExportDisabled ||
                createInvoiceDisabled;

              const href = isPrintExportButton
                ? "#"
                : isAddNewMemoAction
                  ? `${basePath}/sales/new_memo`
                  : isAddNewMemoReturnAction
                    ? `${basePath}/sales/new_credit_memo`
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

                if (isPrintExportButton) {
                  e.preventDefault();
                  onPrintMemo();
                  return;
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
