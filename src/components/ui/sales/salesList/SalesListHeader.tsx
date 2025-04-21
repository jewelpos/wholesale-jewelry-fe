"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import Link from "next/link";
import { Mail, PlusCircle, Upload } from "react-feather";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { MenuAction } from "@/types/permissions";

const renderTooltip = (value: string) => (
  <Tooltip id="tooltip">{value}</Tooltip>
);

const SalesListHeader = () => {
  const { currentMenu, currentPath } = useMenu();
  console.log("sdsdd", currentMenu);

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
            } else if (btn.actionname.includes("print")) {
              return (
                <li key={btn.actionname}>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(btn.actiondisplayname)}
                  >
                    <Link href={""}>
                      <i data-feather="printer" className="feather-printer" />
                    </Link>
                  </OverlayTrigger>
                </li>
              );
            } else if (btn.actionname.includes("email")) {
              return (
                <li key={btn.actionname}>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(btn.actiondisplayname)}
                  >
                    <Link href={""}>
                      <i data-feather="mail" className="feather-mail" />
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
              if (btn.actionname === "add_new_sales_invoice") {
                url = "/new";
              } else if (btn.actionname === "add_new_sales_order") {
                url = "/orders/new";
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

export default SalesListHeader;
