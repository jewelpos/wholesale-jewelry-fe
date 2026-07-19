"use client";

import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useAppSelector } from "@/lib/store/hook";
import { Menus } from "@/types/permissions";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Scrollbar } from "react-scrollbars-custom";

type Props = {
  menus: Menus;
};

const LS_KEY = "sidebar-open-section";

const getIcon = (name?: string): LucideIcon | null => {
  if (!name) return null;
  const icon = (LucideIcons as Record<string, unknown>)[name];
  return icon != null ? (icon as LucideIcon) : null;
};

const Sidebar = ({ menus }: Props) => {
  const path = usePathname();
  const { basePath } = useDefaultRoute();
  const pathname = path.replace(basePath, "");
  const { storePrefix, outletId } = useParams<{ storePrefix: string; outletId: string }>();

  const stores = useAppSelector((state) => state.stores.data);
  const store = useAppSelector((state) => state.store.data);
  const user = useAppSelector((state) => state.user.data);

  const [subOpen, setSubopen] = useState<string>("");
  const [subsidebar, setSubsidebar] = useState("");
  const [outletOpen, setOutletOpen] = useState(false);
  const [isMini, setIsMini] = useState(false);

  const isOwner = !!user?.issysgenmasteraccount;
  const totalOutlets = stores.reduce(
    (sum, s) => sum + (s.outlets?.filter((o) => o.isenabled).length ?? 0),
    0
  );
  const showMobileOutletSwitcher = isOwner || totalOutlets > 1;

  const urlAfterOutlet = (() => {
    const segments = path.split("/").filter(Boolean);
    return segments.length > 3 ? `/${segments.slice(3).join("/")}` : "";
  })();

  const currentStoreName =
    stores.find((s) => s.storeid === store?.storeid)?.storename ??
    store?.storename ??
    stores[0]?.storename ??
    "";

  const currentOutletName = (() => {
    if (outletId) {
      const fromStore = store?.outlets?.find((o) => o.outletid === Number(outletId));
      if (fromStore) return fromStore.outletname;
      for (const s of stores) {
        const found = s.outlets?.find((o) => o.outletid === Number(outletId));
        if (found) return found.outletname;
      }
    }
    return store?.outlets?.[0]?.outletname ?? stores[0]?.outlets?.[0]?.outletname ?? "";
  })();
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  useEffect(() => {
    const check = () => setIsMini(document.body.classList.contains("mini-sidebar"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = () => {
    if (isMini) {
      document.body.classList.add("expand-menu");
      setIsHoverExpanded(true);
    }
  };
  const handleMouseLeave = () => {
    if (isMini) {
      document.body.classList.remove("expand-menu");
      setIsHoverExpanded(false);
    }
  };

  // Submenus collapsed only when mini AND not hover-expanded
  const subCollapsed = isMini && !isHoverExpanded;

  useEffect(() => {
    if (!menus) return;

    // Auto-expand section matching the current path
    for (const menu of menus) {
      const links: string[] = [];
      menu.children?.forEach((sub) => {
        links.push(`${menu.menuurl}${sub.menuurl}`);
        sub.children?.forEach((item) => {
          links.push(`${menu.menuurl}${sub.menuurl}${item.menuurl}`);
        });
      });
      if (links.includes(pathname)) {
        setSubopen(menu.menuname);
        return;
      }
    }

    // No path match (e.g. dashboard) — restore last open from localStorage
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setSubopen(saved);
  }, [pathname, menus]);

  const toggleSidebar = (title: string) => {
    const next = title === subOpen ? "" : title;
    setSubopen(next);
    localStorage.setItem(LS_KEY, next);
  };

  const toggleSubsidebar = (subitem: string) => {
    setSubsidebar((prev) => (prev === subitem ? "" : subitem));
  };

  const closeMobileSidebar = () => {
    document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
    document.querySelector(".sidebar-overlay")?.classList.remove("opened");
    document.querySelector("html")?.classList.remove("menu-opened");
  };

  return (
    <div>
      <div
        className="sidebar"
        id="sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Scrollbar>
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
              {/* Mobile outlet switcher — hidden on desktop (lg+) */}
              {showMobileOutletSwitcher && (
                <div className="d-lg-none" style={{ borderBottom: "1px solid #e9ecef", marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => setOutletOpen((p) => !p)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      padding: "10px 20px",
                      cursor: "pointer",
                      gap: 5,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                      {currentStoreName}
                    </span>
                    <ChevronRight size={11} style={{ color: "#94a3b8", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentOutletName}
                    </span>
                    <ChevronDown
                      size={13}
                      style={{
                        color: "#64748b",
                        flexShrink: 0,
                        transform: outletOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                  <div
                    style={{
                      overflow: "hidden",
                      maxHeight: outletOpen ? "600px" : "0",
                      transition: "max-height 0.25s ease-in-out",
                      background: "#f8f9fa",
                    }}
                  >
                    {stores.map((str) => {
                      const isCurrentStore = str.storeid === store?.storeid;
                      const outlets = isCurrentStore ? (store?.outlets ?? str.outlets) : str.outlets;
                      return (
                        <div key={str.storeid}>
                          {stores.length > 1 && (
                            <div
                              style={{
                                padding: "6px 20px 4px",
                                fontSize: 10,
                                color: "#94a3b8",
                                textTransform: "uppercase",
                                letterSpacing: "0.07em",
                                fontWeight: 700,
                              }}
                            >
                              {str.storename}
                            </div>
                          )}
                          {outlets?.filter((o) => o.isenabled).map((o) => {
                            const isActive = o.outletid === Number(outletId);
                            return (
                              <Link
                                key={o.outletid}
                                href={`/${storePrefix}/${str.storeid}/${o.outletid}${urlAfterOutlet}`}
                                style={{
                                  display: "block",
                                  padding: `8px 20px 8px ${stores.length > 1 ? "32px" : "20px"}`,
                                  fontSize: 13,
                                  color: isActive ? "#6366f1" : "#334155",
                                  fontWeight: isActive ? 600 : 400,
                                  textDecoration: "none",
                                  background: isActive ? "#ede9fe" : "transparent",
                                }}
                                onClick={() => {
                                  setOutletOpen(false);
                                  closeMobileSidebar();
                                }}
                              >
                                {o.outletname}
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <ul>
                <li className="submenu-open">
                  <ul>
                    {menus?.map((menu, i: number) => {
                      const link_array: string[] = [];
                      menu.children?.forEach((subMenu) => {
                        link_array.push(`${menu.menuurl}${subMenu.menuurl}`);
                        subMenu.children?.forEach((item) => {
                          link_array.push(
                            `${menu.menuurl}${subMenu.menuurl}${item.menuurl}`
                          );
                        });
                      });

                      const isOpen = subOpen === menu.menuname;
                      const isActive = link_array.includes(pathname);
                      const MenuIcon =
                        getIcon(menu.iconurl) ?? LucideIcons.LayoutGrid;

                      return (
                        <React.Fragment key={i}>
                          <li
                            className={`submenu ${
                              !menu.children && pathname === menu.menuurl
                                ? "custom-active-hassubroute-false"
                                : ""
                            }`}
                          >
                            <Link
                              href="#"
                              onClick={() => toggleSidebar(menu.menuname)}
                              className={`${isOpen ? "subdrop " : ""}${
                                isActive ? " active" : ""
                              }`}
                            >
                              <MenuIcon size={18} strokeWidth={1.75} />
                              <span className="custom-active-span">
                                {menu.menuname}
                              </span>
                              {menu.children && (
                                <span className="menu-arrow" />
                              )}
                            </Link>

                            <ul
                              style={{
                                display: "block",
                                overflow: "hidden",
                                maxHeight: !subCollapsed && isOpen ? "1000px" : "0px",
                                transition: "max-height 0.28s ease-in-out",
                              }}
                            >
                              {menu.children?.map(
                                (item, titleIndex: number) => {
                                  const isChildActive =
                                    item.children
                                      ?.map((link) => link.menuurl)
                                      .includes(pathname) ||
                                    `${menu.menuurl}${item.menuurl}` ===
                                      pathname;
                                  const ChildIcon = getIcon(item.iconurl);

                                  return (
                                    <li
                                      className="submenu submenu-two"
                                      key={titleIndex}
                                    >
                                      <Link
                                        href={`${basePath}${menu.menuurl}${item.menuurl}`}
                                        style={{ color: "#495057" }}
                                        className={`${
                                          isChildActive ? "active" : ""
                                        } ${
                                          subsidebar === item.menuname
                                            ? "subdrop"
                                            : ""
                                        }`}
                                        onClick={() => {
                                          toggleSubsidebar(item.menuname);
                                          closeMobileSidebar();
                                        }}
                                      >
                                        {ChildIcon && (
                                          <ChildIcon
                                            size={14}
                                            strokeWidth={1.75}
                                            style={{
                                              marginRight: 6,
                                              opacity: 0.65,
                                              flexShrink: 0,
                                            }}
                                          />
                                        )}
                                        {item.menuname}
                                        {item.children && (
                                          <span className="menu-arrow inside-submenu" />
                                        )}
                                      </Link>

                                      <ul
                                        style={{
                                          display: "block",
                                          overflow: "hidden",
                                          maxHeight:
                                            !subCollapsed && subsidebar === item.menuname
                                              ? "600px"
                                              : "0px",
                                          transition:
                                            "max-height 0.22s ease-in-out",
                                        }}
                                      >
                                        {item.children?.map(
                                          (items, subIndex: number) => (
                                            <li key={subIndex}>
                                              <Link
                                                href={`${menu.menuurl}${item.menuurl}${items.menuurl}`}
                                                className={`${
                                                  subsidebar === items.menuname
                                                    ? "submenu-two subdrop"
                                                    : "submenu-two"
                                                } ${
                                                  items.children
                                                    ?.map(
                                                      (link) => link.menuurl
                                                    )
                                                    .includes(pathname) ||
                                                  items.menuurl === pathname
                                                    ? "active"
                                                    : ""
                                                }`}
                                              >
                                                {items.menuname}
                                              </Link>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </li>
                                  );
                                }
                              )}
                            </ul>
                          </li>
                        </React.Fragment>
                      );
                    })}
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </Scrollbar>
      </div>
    </div>
  );
};

export default Sidebar;
