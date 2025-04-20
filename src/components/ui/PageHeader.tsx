"use client";

import React, { useMemo } from "react";
import Breadcrumb from "./Breadcrumb";
import Link from "next/link";
import { useAppSelector } from "@/lib/store/hook";
import { usePathname } from "next/navigation";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { MenuAction } from "@/types/permissions";
import { PlusCircle, Upload } from "react-feather";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
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
