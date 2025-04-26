"use client";

import React from "react";
import Footer from "./Footer";

const Content = ({
  children,
}: Readonly<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}>) => {
  return (
    <div className="page-wrapper">
      <div className="content pt-2">{children}</div>
      <Footer />
    </div>
  );
};

export default Content;
