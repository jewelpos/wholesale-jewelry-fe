"use client";

import { Store, Stores } from "@/types/store";
import Link from "next/link";
import React from "react";

type Props = {
  stores: Stores;
  store: Store;
  storeLoading: boolean;
};

const StoreDropdown = ({ stores, store, storeLoading }: Props) => {
  if (storeLoading) {
    return <i className="fas fa-spinner fa-spin me-2" />;
  }
  return (
    <li className="nav-item dropdown has-arrow main-drop select-store-dropdown">
      <Link
        href="#"
        className="dropdown-toggle nav-link select-store"
        data-bs-toggle="dropdown"
      >
        <span className="user-info">
          <span className="user-letter"></span>
          <span className="user-detail">
            <span className="user-name">
              {store?.storename ?? "Select Store"}{" "}
            </span>
          </span>
        </span>
      </Link>
      <div className="dropdown-menu dropdown-menu-right">
        {stores?.map((str) => (
          <Link
            key={str.storeid}
            href={`/jw/${str.storeid}/home`}
            className={`dropdown-item ${
              str.storeid === store?.storeid && "active"
            }`}
          >
            {str.storename}
          </Link>
        ))}
      </div>
    </li>
  );
};

export default StoreDropdown;
