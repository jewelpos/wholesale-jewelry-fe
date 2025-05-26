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

const SupplierInvoiceListHeader = ({}) => {
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
                      <Upload />
                    </Link>
                  </OverlayTrigger>
                </li>
              );
            }
            return null;
          })}
      </ul>
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action.length &&
          currentMenu.action.map((btn: MenuAction) => {
            if (btn.actionname.includes("add_")) {
              let url = "";
              if (btn.actionname === "add_new_ap_invoice") {
                url = "/new";
              }

              return (
                <div className="page-btn" key={btn.actionname}>
                  <Link href={`${currentPath}${url}`} className="btn btn-added">
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

export default SupplierInvoiceListHeader;
