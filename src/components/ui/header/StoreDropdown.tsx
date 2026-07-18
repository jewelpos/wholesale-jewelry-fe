"use client";

import { useAppSelector } from "@/lib/store/hook";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useState } from "react";
import { ChevronRight } from "react-feather";
import { Dropdown } from "react-bootstrap";

type Props = {
  storeLoading: boolean;
};

const StoreDropdown = ({ storeLoading }: Props) => {
  const stores = useAppSelector((state) => state.stores.data);
  const store = useAppSelector((state) => state.store.data);
  const user = useAppSelector((state) => state.user.data);
  const { outletId } = useParams();
  const pathname = usePathname();
  const [hoveredStoreId, setHoveredStoreId] = useState<string | number | null>(
    null
  );

  const urlAfterStoreIdAndOutletId = (() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length > 3 ? `/${segments.slice(3).join("/")}` : "";
  })();

  if (!stores.length) {
    return <></>;
  }

  const isOwner = !!user?.issysgenmasteraccount;

  // Count only the outlets that came back from the server (already filtered to user's access)
  const totalOutlets = stores.reduce(
    (sum, s) => sum + (s.outlets?.filter((o) => o.isenabled).length ?? 0),
    0
  );

  // Owner always gets the dropdown (all outlets); everyone else only if they have >1.
  const showDropdown = isOwner || totalOutlets > 1;

  const defaultOutletName = (() => {
    for (const storeItem of stores) {
      const o = storeItem.outlets?.find((o) => o.isenabled && o.isdefaultoutlet);
      if (o) return o.outletname;
    }
    return stores[0]?.outlets?.[0]?.outletname ?? "No outlet available";
  })();

  return (
    <>
      {!showDropdown && (
        <li className="nav-item d-flex align-items-center">
          <span className="nav-link text-dark">{defaultOutletName}</span>
        </li>
      )}
      {showDropdown && (
        <Dropdown
          as="li"
          className="nav-item has-arrow main-drop select-store-dropdown store-with-label d-flex align-items-center"
          autoClose="outside"
        >
          <span className="dropdown-side-label me-2 text-muted">
            {stores.length === 1 ? "Outlets:" : "Stores & Outlets:"}
          </span>
          <Dropdown.Toggle
            as={Link}
            href="#"
            className="nav-link select-store mx-2"
          >
            <span className="user-info">
              <span className="user-letter"></span>
              <span className="user-detail">
                <span className="user-name">
                  {store?.storename && (
                    <>
                      {store?.storename} -{" "}
                      {store?.outlets?.find(
                        (o) => o.outletid === Number(outletId)
                      )?.outletname || stores[0]?.outlets?.[0]?.outletname}{" "}
                    </>
                  )}
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
          </Dropdown.Toggle>

          <Dropdown.Menu align="end" className="dropdown-menu-right">
            {stores?.map((str) => {
              const isCurrentStore = str.storeid === store?.storeid;
              // GetStore (singular) returns all user-accessible outlets;
              // GetStores (plural) only returns the default outlet per store.
              // Use the richer store.outlets for the active store.
              const outlets = isCurrentStore
                ? (store?.outlets ?? str.outlets)
                : str.outlets;
              return (
                <Dropdown
                  key={str.storeid}
                  as="div"
                  drop="end"
                  className="dropdown"
                  show={hoveredStoreId === str.storeid}
                  onMouseEnter={() => setHoveredStoreId(str.storeid)}
                  onMouseLeave={() => setHoveredStoreId(null)}
                >
                  <Dropdown.Toggle
                    as={Link}
                    href="#"
                    className={`dropdown-item d-flex align-items-center justify-content-between ${
                      isCurrentStore ? "active" : ""
                    }`}
                  >
                    <span>{str.storename}</span>
                    {outlets?.length ? (
                      <ChevronRight
                        size={14}
                        className={`ms-auto ${isCurrentStore ? "text-white" : ""}`}
                      />
                    ) : null}
                  </Dropdown.Toggle>

                  {outlets?.length ? (
                    <Dropdown.Menu className="active">
                      {outlets
                        .filter((o) => o.isenabled)
                        .map((o) => {
                          const active = o.outletid === Number(outletId);
                          return (
                            <Dropdown.Item
                              as={Link}
                              href={`/jw/${str.storeid}/${o.outletid}${urlAfterStoreIdAndOutletId}`}
                              key={o.outletid}
                              className={active ? "active" : ""}
                            >
                              {o.outletname}
                            </Dropdown.Item>
                          );
                        })}
                    </Dropdown.Menu>
                  ) : null}
                </Dropdown>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </>
  );
};

export default StoreDropdown;
