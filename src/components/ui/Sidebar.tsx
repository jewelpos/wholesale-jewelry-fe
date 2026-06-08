import useDefaultRoute from "@/hooks/useDefaultRoute";
import { Menus } from "@/types/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Scrollbar } from "react-scrollbars-custom";

type Props = {
  menus: Menus;
};

const LS_KEY = "sidebar-open-section";

const getIcon = (name?: string): LucideIcon | null => {
  if (!name) return null;
  const icon = (LucideIcons as Record<string, unknown>)[name];
  return (typeof icon === "function" ? icon : null) as LucideIcon | null;
};

const Sidebar = ({ menus }: Props) => {
  const path = usePathname();
  const { basePath } = useDefaultRoute();
  const pathname = path.replace(basePath, "");

  const [subOpen, setSubopen] = useState<string>("");
  const [subsidebar, setSubsidebar] = useState("");

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

  return (
    <div>
      <div className="sidebar" id="sidebar">
        <Scrollbar>
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
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
                                maxHeight: isOpen ? "1000px" : "0px",
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
                                        onClick={() =>
                                          toggleSubsidebar(item.menuname)
                                        }
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
                                            subsidebar === item.menuname
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
