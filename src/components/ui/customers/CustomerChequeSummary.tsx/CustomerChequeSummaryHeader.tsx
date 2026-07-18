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
  setOpenAddChequeModal,
  onExport,
  onPrint,
}: {
  setOpenAddChequeModal: (value: boolean) => void;
  onExport: () => void;
  onPrint: () => void;
}) => {
  const { currentMenu } = useMenu();

  const handleActionClick = (action: MenuAction) => {
    switch (action.actionname) {
      case "add_new_checks":
        setOpenAddChequeModal(true);
        break;
      case "export_customer_onhand_check":
        onExport();
        break;
      case "print_check_list":
        onPrint();
        break;
      default:
        break;
    }
  };

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
              return (
                <div
                  className="page-btn"
                  key={btn.actionname}
                >
                  <Link
                    href="#"
                    onClick={() => handleActionClick(btn)}
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
