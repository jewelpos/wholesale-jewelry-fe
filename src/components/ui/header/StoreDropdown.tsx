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
  // Track which store item is currently hovered so its submenu stays open
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

  return (
    <>
      {user?.roleid !== 1 && (
        <li className="nav-item d-flex align-items-center">
          <span className="nav-link text-dark">
            {(() => {
              // Find the default outlet across all stores
              for (const storeItem of stores) {
                const defaultOutlet = storeItem.outlets?.find(
                  (outlet) => outlet.isenabled && outlet.isdefaultoutlet
                );
                if (defaultOutlet) {
                  return defaultOutlet.outletname;
                }
              }
              // Fallback to first available outlet if no default found
              return stores[0]?.outlets?.[0]
                ? stores[0].outlets[0].outletname
                : "No outlet available";
            })()}
          </span>
        </li>
      )}
      {user?.roleid === 1 && (
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
              const active = str.storeid === store?.storeid;
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
                      active ? "active" : ""
                    }`}
                  >
                    <span>{str.storename}</span>
                    {str.outlets?.length ? (
                      <ChevronRight
                        size={14}
                        className={`ms-auto ${active ? "text-white" : ""}`}
                      />
                    ) : null}
                  </Dropdown.Toggle>

                  {str.outlets?.length ? (
                    <Dropdown.Menu className="active">
                      {str.outlets
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
