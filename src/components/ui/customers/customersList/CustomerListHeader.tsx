"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import Link from "next/link";
import { PlusCircle, Upload } from "react-feather";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { MenuAction } from "@/types/permissions";

const renderTooltip = (value: string) => (
  <Tooltip id="tooltip">{value}</Tooltip>
);

interface CustomerListHeaderProps {
  selectedCustomerId?: number;
}

const CustomerListHeader = ({
  selectedCustomerId,
}: CustomerListHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <ul className="table-top-head">
        {!!currentMenu?.action.length &&
          currentMenu.action.map((btn: MenuAction) => {
            if (btn.actionname.includes("export")) {
              return (
                <li key={btn.actionname}>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(btn.actiondisplayname)}
                  >
                    <Link href={""}>
                      <i data-feather="upload" className="feather-upload" />
                    </Link>
                  </OverlayTrigger>
                </li>
              );
            }
            return null;
          })}
        {selectedCustomerId && (
          <>
            <li>
              <Link href={""} title="Mail">
                <i data-feather="mail" className="feather-mail" />
              </Link>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip("Print")}>
                <Link href={""}>
                  <i data-feather="printer" className="feather-printer" />
                </Link>
              </OverlayTrigger>
            </li>
          </>
        )}
      </ul>
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
            }
            return null;
          })}
      </div>
    </PageHeader>
  );
};

export default CustomerListHeader;
