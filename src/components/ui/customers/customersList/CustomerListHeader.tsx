"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import Link from "next/link";
import { Download, PlusCircle, RotateCcw, Upload } from "react-feather";
import { OverlayTrigger } from "react-bootstrap";
import { MenuAction } from "@/types/permissions";

const CustomerListHeader = () => {
  const { currentMenu, currentPath } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      {/* {!!currentMenu?.action.length &&
        currentMenu.action.map((btn: MenuAction) => {
          if (btn.actionname.includes("add_new")) {
            return (
              <div className="page-btn" key={btn.actionname}>
                <Link
                  href={`${basePath}${parentPath}/new`}
                  className="btn btn-added"
                >
                  <PlusCircle className="me-2 iconsize" />
                  {btn.actiondisplayname}
                </Link>
              </div>
            );
          } else if (btn.actionname.includes("export")) {
            return (
              <div className="page-btn import" key={btn.actionname}>
                <Link
                  href={`${basePath}/supplier/new`}
                  className="btn btn-added btn-secondary"
                >
                  <Upload className="me-2 iconsize" />
                  {btn.actiondisplayname}
                </Link>
              </div>
            );
          }
          return (
            <div className="page-btn" key={btn.actionname}>
              <Link href={`${basePath}`} className="btn btn-added">
                {btn.actiondisplayname}
              </Link>
            </div>
          );
        })} */}
      <ul className="table-top-head">
        {!!currentMenu?.action.length &&
          currentMenu.action.map((btn: MenuAction) => {
            if (btn.actionname.includes("export")) {
              return (
                <li key={btn.actionname}>
                  <OverlayTrigger placement="top" overlay={<></>}>
                    <Link href={""}>
                      <Upload />
                    </Link>
                  </OverlayTrigger>
                </li>
              );
            }
            return <></>;
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
                    Add New Purchase
                  </Link>
                </div>
              );
            }
            return <></>;
          })}
      </div>
    </PageHeader>
  );
};

export default CustomerListHeader;
