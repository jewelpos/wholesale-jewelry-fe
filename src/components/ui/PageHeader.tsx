"use client";

import React from "react";
import Breadcrumb from "./Breadcrumb";

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  showBreadcrumb?: boolean;
};

const PageHeader = ({ title, subtitle, children, showBreadcrumb }: Props) => {
  return (
    <div className="page-header mb-1">
      <div className="add-item d-flex">
        <div className="page-title">
          <h4>{title}</h4>
          {subtitle && <h6 className="mb-1">{subtitle}</h6>}
          {showBreadcrumb && <Breadcrumb />}
        </div>
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
