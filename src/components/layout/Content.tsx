"use client";

import React from "react";
import PageHeader from "../ui/PageHeader";

const Content = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="page-wrapper ">
      <div className="content pt-2">
        <PageHeader showBreadcrumb />
        <div className="card table-list-card">{children}</div>
      </div>
    </div>
  );
};

export default Content;
