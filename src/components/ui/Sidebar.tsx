import { useAppSelector } from "@/lib/store/hook";
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
  let pathname = usePathname();
  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");

  pathname += "/";
  const toggleSidebar = (title: any) => {
    if (title == subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem: any) => {
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
                    {menus.map((mainMenu, i: number) => {
                      let menu = { ...mainMenu };
                      let link_array: any = [];
                      menu?.children?.map((subMenu) => {
                        link_array.push(subMenu?.menuurl);
                        if (subMenu?.children) {
                          subMenu?.children?.map((item) => {
                            link_array.push(item?.menuurl);
                          });
                        }
                        return link_array;
                      });
                      menu.menuUrl = link_array;
                      return (
                        <React.Fragment key={i}>
                          {/* {" "} */}
                          <li
                            className={`submenu ${
                              !menu?.children && pathname === menu?.menuUrl
                                ? "custom-active-hassubroute-false"
                                : ""
                            }`}
                          >
                            <Link
                              href={menu?.menuUrl}
                              onClick={() => toggleSidebar(menu?.menuName)}
                              className={`${
                                subOpen === menu?.menuName ? "subdrop " : ""
                              } ${
                                menu?.menuUrl?.includes(pathname)
                                  ? " active"
                                  : ""
                              }`}
                            >
                              <Icon.Grid />
                              <span className="custom-active-span">
                                {menu?.menuName}
                              </span>
                              {menu?.children && (
                                <span className="menu-arrow" />
                              )}
                            </Link>
                            <ul
                              style={{
                                display:
                                  subOpen === menu?.menuName ? "block" : "none",
                              }}
                            >
                              {menu?.children?.map((item, titleIndex: any) => (
                                <li
                                  className="submenu submenu-two"
                                  key={titleIndex}
                                >
                                  <Link
                                    href={item.menuurl}
                                    className={`${
                                      item?.children
                                        ?.map((link) => link.menuurl)
                                        .includes(pathname) ||
                                      item?.menuurl === pathname
                                        ? "active"
                                        : ""
                                    } ${
                                      subsidebar === item?.permissiondisplayname
                                        ? "subdrop"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      toggleSubsidebar(
                                        item?.permissiondisplayname
                                      )
                                    }
                                  >
                                    {item?.permissiondisplayname}
                                    {item?.children && (
                                      <span className="menu-arrow inside-submenu" />
                                    )}
                                  </Link>
                                  <ul
                                    style={{
                                      display:
                                        subsidebar ===
                                        item?.permissiondisplayname
                                          ? "block"
                                          : "none",
                                    }}
                                  >
                                    {item?.children?.map(
                                      (items, subIndex: any) => (
                                        <li key={subIndex}>
                                          <Link
                                            href={items.menuurl}
                                            className={`${
                                              subsidebar ===
                                              items?.permissiondisplayname
                                                ? "submenu-two subdrop"
                                                : "submenu-two"
                                            } ${
                                              items?.children
                                                ?.map((link) => link.menuurl)
                                                .includes(pathname) ||
                                              items?.menuurl === pathname
                                                ? "active"
                                                : ""
                                            }`}
                                          >
                                            {items?.permissiondisplayname}
                                          </Link>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </li>
                              ))}
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
