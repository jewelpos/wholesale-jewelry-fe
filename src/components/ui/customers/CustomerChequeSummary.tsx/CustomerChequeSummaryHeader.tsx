"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import Link from "next/link";
import { PlusCircle } from "react-feather";

const CustomerChequeSummaryHeader = () => {
  const { currentMenu, currentPath } = useMenu();
  console.log("currentMenu", currentMenu);
  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action.length &&
          currentMenu.action.map((btn: MenuAction) => {
            if (btn.actionname.includes("add_new")) {
              return (
                <div className="page-btn" key={btn.actionname}>
                  <Link href={`${currentPath}/new`} className="btn btn-added">
                    <PlusCircle className="me-2" />
                    {btn.actiondisplayname}
                  </Link>
                </div>
              );
            } else if (btn.actionname.includes("export")) {
              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={`${currentPath}/new`}
                    className="btn btn-added btn-dark"
                  >
                    <i data-feather="upload" className="feather-upload me-2" />
                    {btn.actiondisplayname}
                  </Link>
                </div>
              );
            }
            return null;
          })}
      </div>
    </PageHeader>
  );
};

export default CustomerChequeSummaryHeader;
