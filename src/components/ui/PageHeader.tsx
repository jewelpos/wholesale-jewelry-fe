"use client";

import React from "react";
import Breadcrumb from "./Breadcrumb";

type Props = {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  showBreadcrumb?: boolean;
  rightSection?: React.ReactNode;
};

const PageHeader = ({ title, subtitle, children, showBreadcrumb, rightSection }: Props) => {
  return (
    <div className="page-header mb-1">
      <div className="add-item d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
        <div className="page-title">
          <h4 className="mb-0">{title}</h4>
          {subtitle && <h6 className="mb-0 mt-1" style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>{subtitle}</h6>}
        </div>
        {rightSection && (
          <div className="d-flex align-items-end gap-2 flex-shrink-0">
            {rightSection}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
