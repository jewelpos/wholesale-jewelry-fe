"use client";

import { useAppSelector } from "@/lib/store/hook";
import Link from "next/link";
import React from "react";

const StoreDropdown = () => {
  const stores = useAppSelector((state) => state.stores.data);

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
            <span className="user-name">Select Store</span>
          </span>
        </span>
      </Link>
      <div className="dropdown-menu dropdown-menu-right">
        {stores.map((store) => (
          <Link href={`/jw/${store.storeid}/home`} className="dropdown-item">
            {store.storename}
          </Link>
        ))}
      </div>
    </li>
  );
};

export default StoreDropdown;
