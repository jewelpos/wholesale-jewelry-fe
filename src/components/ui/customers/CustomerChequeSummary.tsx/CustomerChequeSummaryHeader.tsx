"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";
import Link from "next/link";

const CustomerChequeSummaryHeader = ({
  setShowPrintModal,
  setOpenAddChequeModal,
}: {
  setShowPrintModal: (value: boolean) => void;
  setOpenAddChequeModal: (value: boolean) => void;
}) => {
  const { currentMenu, currentPath } = useMenu();

  const handleActionClick = (action: MenuAction) => {
    switch (action.actionname) {
      case "add_new_checks":
        setOpenAddChequeModal(true);
        break;
      case "print_check_list":
        setShowPrintModal(true);
        break;
      default:
        break;
    }
  };
  console.log(currentMenu);

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
              const isModalButton =
                btn.actionname.includes("add_new_checks") ||
                btn.actionname.includes("print_check_list");
              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={isModalButton ? "#" : `${currentPath}/new`}
                    onClick={() =>
                      isModalButton ? handleActionClick(btn) : null
                    }
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

export default CustomerChequeSummaryHeader;
