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

const SupplierListHeader = ({
  setShowInvoiceFormModal,
}: {
  setShowInvoiceFormModal: (value: boolean) => void;
}) => {
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
                return (
                  <div className="page-btn" key={btn.actionname}>
                    <Link
                      href={"#"}
                      onClick={() => setShowInvoiceFormModal(true)}
                      className="btn btn-added"
                    >
                      <PlusCircle className="me-2" />
                      {btn.actiondisplayname}
                    </Link>
                  </div>
                );
              } else {
                if (btn.actionname === "add_new_supplier") {
                  url = "/new";
                } else if (btn.actionname === "add_supplier_payment") {
                  url = "/payments";
                } else if (btn.actionname === "add_new_ap_check") {
                  url = "/checks";
                }
                return (
                  <div className="page-btn" key={btn.actionname}>
                    <Link
                      href={`${currentPath}${url}`}
                      className="btn btn-added"
                    >
                      <PlusCircle className="me-2" />
                      {btn.actiondisplayname}
                    </Link>
                  </div>
                );
              }
            }
            return null;
          })}
      </div>
    </PageHeader>
  );
};

export default SupplierListHeader;
