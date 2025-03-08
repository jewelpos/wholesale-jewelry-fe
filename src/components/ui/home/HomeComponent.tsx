"use client";

import React from "react";
import InfoHeader from "../InfoHeader";
import { useAppSelector } from "@/lib/store/hook";
import HomeCatalogTiles from "./HomeCatalogTiles";
import homeCatalog from "@/lib/utils/homeCatalog.json";
import { catalogType } from "@/types/home";

const HomeComponent = () => {
  const user = useAppSelector((state) => state.user.data);
  const catalogues: catalogType[] = homeCatalog;

  return (
    <>
      <InfoHeader
        title={`Welcome ${user?.name},`}
        para="Create your first store and details."
      />
      <div className="content ">
        <div className="row">
          {catalogues.map((catalog, index: number) => (
            <HomeCatalogTiles
              catalog={catalog}
              key={catalog.title}
              index={index}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default HomeComponent;
