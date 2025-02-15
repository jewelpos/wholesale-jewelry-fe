"use client";

import React from "react";
import InfoHeader from "../InfoHeader";
import { useAppSelector } from "@/lib/store/hook";
import HomeCatalogTiles from "./HomeCatalogTiles";
import homeCatalog from "@/lib/utils/homeCatalog.json";
import { catalogType } from "@/types/home";

const MainHomeComponent = () => {
  const user = useAppSelector((state) => state.user.data);
  const catalogues: catalogType[] = homeCatalog;

  return (
    <>
      <div className="content container">
        <InfoHeader
          title={`Hi ${user?.name},`}
          para="Manage your business efficiently with quick access to key modules."
        />
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

export default MainHomeComponent;
