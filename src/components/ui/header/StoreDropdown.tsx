"use client";

import { useAppSelector } from "@/lib/store/hook";
import Link from "next/link";
import React from "react";

type Props = {
  storeLoading: boolean;
};

const StoreDropdown = ({ storeLoading }: Props) => {
  const stores = useAppSelector((state) => state.stores.data);
  const store = useAppSelector((state) => state.store.data);

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
              {storeLoading && (
                <>
                  &nbsp;
                  <div
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                </>
              )}
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
