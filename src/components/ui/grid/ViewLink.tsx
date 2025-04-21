import useDefaultRoute from "@/hooks/useDefaultRoute";
import { ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import React from "react";

export interface ViewLinkRendererParams<T = any> extends ICellRendererParams {
  link: string;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const ViewLink = <T extends unknown>({
  value,
  link = "",
}: ViewLinkRendererParams<T>) => {
  const { basePath } = useDefaultRoute();
  return (
    <Link href={`${basePath}${link}`}>
      <strong>
        <u>{value}</u>
      </strong>
    </Link>
  );
};

export default ViewLink;
