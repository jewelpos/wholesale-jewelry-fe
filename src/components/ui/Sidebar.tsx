import { useAppSelector } from "@/lib/store/hook";
import { Menus } from "@/types/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { Fragment, useState } from "react";
import * as Icon from "react-feather";
export const SidebarData = [
  {
    label: "Main",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: <Icon.Grid />,
        submenu: true,
        showSubRoute: false,

        submenuItems: [
          { label: "Admin Dashboard", link: "/admin-dashboard" },
          { label: "Sales Dashboard", link: "/sales-dashboard" },
        ],
      },
      {
        label: "Application",
        icon: <Icon.Smartphone />,
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Chat", link: "/chat", showSubRoute: false },
          {
            label: "Call",
            submenu: true,
            submenuItems: [
              { label: "Video Call", link: "/video-call" },
              { label: "Audio Call", link: "/audio-call" },
              { label: "Call History", link: "/call-history" },
            ],
          },
          { label: "Calendar", link: "/calendar", showSubRoute: false },
          { label: "Email", link: "/email", showSubRoute: false },
          { label: "To Do", link: "/todo", showSubRoute: false },
          { label: "Notes", link: "/notes", showSubRoute: false },
          { label: "File Manager", link: "/file-manager", showSubRoute: false },
        ],
      },
    ],
  },
  {
    label: "Inventory",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Inventory",
    submenuItems: [
      {
        label: "Products",
        link: "/product-list",
        icon: <Icon.Box />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Create Product",
        link: "/add-product",
        icon: <Icon.PlusSquare />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Expired Products",
        link: "/expired-products",
        icon: <Icon.Codesandbox />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Low Stocks",
        link: "/low-stocks",
        icon: <Icon.TrendingDown />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Category",
        link: "/category-list",
        icon: <Icon.Codepen />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Sub Category",
        link: "/sub-categories",
        icon: <Icon.Speaker />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Brands",
        link: "/brand-list",
        icon: <Icon.Tag />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Units",
        link: "/units",
        icon: <Icon.Speaker />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Variant Attributes",
        link: "/variant-attributes",
        icon: <Icon.Layers />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Warranties",
        link: "/warranty",
        icon: <Icon.Bookmark />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Print Barcode",
        link: "/barcode",
        icon: <Icon.AlignJustify />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Print QR Code",
        link: "/qrcode",
        icon: <Icon.Maximize />,
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
];

const Sidebar = () => {
  const pathname = usePathname();

  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");
  const menus: Menus = useAppSelector(
    (state) => state.user.data.permissions[0].menus
  );

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
    <div className="sidebar" id="sidebar">
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu" className="sidebar-menu">
          <ul>
            {/* {sidebar?.map((mainLabel: any, index: number) => ( */}
            <li className="submenu-open">
              <h6 className="submenu-hdr">sdfsd</h6>
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
                      {" "}
                      <li
                        className={`submenu ${
                          !menu?.children && pathname === menu?.menuUrl
                            ? "custom-active-hassubroute-false"
                            : ""
                        }`}
                      >
                        <Link
                          href={""}
                          onClick={() => toggleSidebar(menu?.menuName)}
                          className={`${
                            subOpen === menu?.menuName ? "subdrop" : ""
                          } ${
                            menu?.menuUrl?.includes(pathname) ? "active" : ""
                          }`}
                        >
                          <Icon.Grid />
                          <span className="custom-active-span">
                            {menu?.menuName}
                          </span>
                          {menu?.children && <span className="menu-arrow" />}
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
                                href={""}
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
                                  toggleSubsidebar(item?.permissiondisplayname)
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
                                    subsidebar === item?.permissiondisplayname
                                      ? "block"
                                      : "none",
                                }}
                              >
                                {item?.children?.map((items, subIndex: any) => (
                                  <li key={subIndex}>
                                    <Link
                                      href={""}
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
                                ))}
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
    </div>
  );
};

export default Sidebar;
