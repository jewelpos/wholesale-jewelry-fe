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
  setShowPrintModal: (value: boolean) => void;
}

const CustomerListHeader = ({
  selectedCustomerId,
  setShowPrintModal,
}: CustomerListHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();
  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <ul className="table-top-head d-block d-sm-none">
        {!!currentMenu?.action.length &&
          currentMenu.action.map((btn: MenuAction) => {
            if (btn.actionname.includes("export") && selectedCustomerId) {
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
            } else if (btn.actionname.includes("print") && selectedCustomerId) {
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
            }
            return null;
          })}
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
            } else if (btn.actionname.includes("print") && selectedCustomerId) {
              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={"#"}
                    onClick={() => setShowPrintModal(true)}
                    className="btn btn-added btn-info"
                  >
                    <i
                      data-feather="printer"
                      className="feather-printer me-2"
                    />
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
