import { Menus } from "@/types/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import * as Icon from "react-feather";
import { Scrollbar } from "react-scrollbars-custom";

type Props = {
  menus: Menus;
};

const Sidebar = ({ menus }: Props) => {
  const pathname = usePathname();
  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");

  const toggleSidebar = (title: string) => {
    if (title == subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem: string) => {
    if (subitem == subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
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
                      menu?.children?.map((subMenu) => {
                        link_array.push(`${menu.menuurl}${subMenu.menuurl}`);
                        if (subMenu.children) {
                          subMenu.children.map((item) => {
                            link_array.push(
                              `${menu.menuurl}${subMenu.menuurl}${item.menuurl}`
                            );
                          });
                        }
                        return link_array;
                      });
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
                              href={"#"}
                              // href={`${link_array[0]}`}
                              onClick={() => toggleSidebar(menu.menuname)}
                              className={`${
                                subOpen === menu.menuname ? "subdrop " : ""
                              } ${
                                link_array.includes(pathname) ? " active" : ""
                              }`}
                            >
                              <Icon.Grid />
                              <span className="custom-active-span">
                                {menu.menuname}
                              </span>
                              {menu.children && <span className="menu-arrow" />}
                            </Link>
                            <ul
                              style={{
                                display:
                                  subOpen === menu.menuname ? "block" : "none",
                              }}
                            >
                              {menu.children?.map(
                                (item, titleIndex: number) => (
                                  <li
                                    className="submenu submenu-two"
                                    key={titleIndex}
                                  >
                                    <Link
                                      href={`${menu.menuurl}${item.menuurl}`}
                                      className={`${
                                        item.children
                                          ?.map((link) => link.menuurl)
                                          .includes(pathname) ||
                                        `${menu.menuurl}${item.menuurl}` ===
                                          pathname
                                          ? "active"
                                          : ""
                                      } ${
                                        subsidebar === item.menuname
                                          ? "subdrop"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        toggleSubsidebar(item.menuname)
                                      }
                                    >
                                      {item.menuname}
                                      {item.children && (
                                        <span className="menu-arrow inside-submenu" />
                                      )}
                                    </Link>
                                    <ul
                                      style={{
                                        display:
                                          subsidebar === item.menuname
                                            ? "block"
                                            : "none",
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
                                                  ?.map((link) => link.menuurl)
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
                                )
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
