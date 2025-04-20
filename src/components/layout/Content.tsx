"use client";

import React from "react";

const Content = ({
  children,
}: Readonly<{
  children: React.ReactNode;
  showBreadcrumb?: boolean;
  title?: string;
  subtitle?: string;
}>) => {
  return (
    <div className="page-wrapper ">
      <div className="content pt-2">{children}</div>
    </div>
  );
};

export default Content;
