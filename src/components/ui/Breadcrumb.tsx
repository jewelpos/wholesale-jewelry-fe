"use client";

import useDefaultRoute from "@/hooks/useDefaultRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { Fragment } from "react";

interface BreadcrumbProps {
  containerClasses?: string;
  listClasses?: string;
  activeItemClasses?: string;
  inactiveItemClasses?: string;
  capitalizeItems?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ capitalizeItems = true }) => {
  const pathname = usePathname();
  const { homePagePath, basePath } = useDefaultRoute();

  const pathSegments = pathname
    .split("/")
    .filter((segment) => segment !== "" && !homePagePath.includes(segment));

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
    let label = segment.replace(/-/g, " ");
    if (capitalizeItems) {
      label = label
        .replace("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    const isLastItem = index === pathSegments.length - 1;

    return {
      href,
      label,
      isLastItem,
    };
  });

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb breadcrumb-arrow mb-0">
        <li className="breadcrumb-item">
          <Link href={homePagePath}>Home</Link>
        </li>
        {breadcrumbItems.map((item) => (
          <Fragment key={`${item.label}`}>
            {item.isLastItem ? (
              <li className="breadcrumb-item active" aria-current="page">
                {item.label}
              </li>
            ) : (
              <li className="breadcrumb-item">
                <Link href={`${basePath}${item.href}`}>{item.label}</Link>
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
