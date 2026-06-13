"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import Link from "next/link";
import FeatherIcon from "../../FeatherIcon";

interface SupplierLedgerActivityHeaderProps {
  onExport?: () => void;
}

const SupplierLedgerActivityHeader = ({ onExport }: SupplierLedgerActivityHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action?.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);

              if (btn.actionname.includes("export")) {
                return (
                  <div className="page-btn d-none d-sm-block" key={btn.actionname}>
                    <button
                      type="button"
                      className={`btn btn-added ${btnColor}`}
                      onClick={onExport}
                    >
                      {iconName && <FeatherIcon icon={iconName} />}
                      {btn.actiondisplayname}
                    </button>
                  </div>
                );
              }

              return (
                <div className="page-btn d-none d-sm-block" key={btn.actionname}>
                  <Link href={`${currentPath}/new`} className={`btn btn-added ${btnColor}`}>
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

export default SupplierLedgerActivityHeader;
