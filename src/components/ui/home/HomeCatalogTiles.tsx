"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Tool } from "react-feather";
import { catalogType } from "@/types/home";
import { useParams } from "next/navigation";
import useDefaultRoute from "@/hooks/useDefaultRoute";

type Props = {
  catalog: catalogType;
  index: number;
};

const HomeCatalogTiles = ({ catalog, index }: Props) => {
  const { storeId } = useParams();
  const { basePath } = useDefaultRoute();

  return (
    <div
      className="col-xxl-3 col-xl-6 col-lg-6 col-md-6 d-flex "
      key={catalog.title}
    >
      <div className={`connected-app-card d-flex w-100 `}>
        <ul className={`w-100 ${!storeId && index !== 0 && "disabled-card"}`}>
          <li className="flex-column align-items-start">
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="security-type d-flex align-items-center">
                <span className="system-app-icon">
                  <Image
                    src={catalog.icon}
                    height={40}
                    width={40}
                    alt={`${catalog.title} gif`}
                    unoptimized
                  />
                </span>
                <div className="security-title">
                  <h6 className="lead">
                    <b>{catalog.title}</b>
                  </h6>
                </div>
              </div>
            </div>
            <br></br>
            <p className="lead">{catalog.para}</p>
            <Link className="btn-link " href={catalog.linkUrl}>
              {catalog.linkText}
            </Link>
          </li>
          <li>
            <div className="integration-btn">
              {catalog.btnText && (
                <Link
                  href={`${basePath}${catalog.btnUrl}` || "#"}
                  type="button"
                  className="btn btn-outline-primary rounded-pill "
                >
                  <Tool className="me-2" />
                  {catalog.btnText}
                </Link>
              )}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HomeCatalogTiles;
