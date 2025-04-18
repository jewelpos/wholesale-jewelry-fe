"use client";

import React from "react";
import PageHeader from "../ui/PageHeader";

const Content = ({
  children,
  showBreadcrumb = true,
  title,
  subtitle,
}: Readonly<{
  children: React.ReactNode;
  showBreadcrumb?: boolean;
  title?: string;
  subtitle?: string;
}>) => {
  return (
    <div className="page-wrapper ">
      <div className="content pt-2">
        <PageHeader
          showBreadcrumb={showBreadcrumb}
          title={title}
          subtitle={subtitle}
        />
        <div className="card table-list-card">{children}</div>
      </div>
    </div>
  );
};

export default Content;
