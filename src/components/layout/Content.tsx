"use client";

import React from "react";
import Footer from "./Footer";
import { FloatingFilterProvider } from "../ui/grid/FloatingFilterContext";

const Content = ({
  children,
}: Readonly<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}>) => {
  return (
    <FloatingFilterProvider>
      <div className="page-wrapper">
        <div className="content pt-2">{children}</div>
        <Footer />
      </div>
    </FloatingFilterProvider>
  );
};

export default Content;
