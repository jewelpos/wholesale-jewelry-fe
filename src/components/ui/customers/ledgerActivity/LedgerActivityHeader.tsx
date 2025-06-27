"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import Link from "next/link";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";

const LedgerActivityHeader = () => {
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
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={`${currentPath}/new`}
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

export default LedgerActivityHeader;
