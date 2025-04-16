import { ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import React from "react";

export interface SelectLinkRendererParams<T = any> extends ICellRendererParams {
  link: string;
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const SelectLink = <T extends unknown>({
  value,
  link = "",
}: SelectLinkRendererParams<T>) => {
  return (
    <Link href={link}>
      <strong>
        <u>{value}</u>
      </strong>
    </Link>
  );
};

export default SelectLink;
