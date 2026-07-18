"use client";

import { useAppSelector } from "@/lib/store/hook";
import { GET_OUTLETS_QUERY } from "@/lib/graphql/query/outlet";
import { useQuery } from "@apollo/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings, User, ChevronsLeft, LogOut } from "react-feather";
import StoreDropdown from "./StoreDropdown";
import { useParams } from "next/navigation";
import type { Menus } from "@/types/permissions";

type Props = {
  onLogout: () => Promise<boolean | void>;
  storeLoading: boolean;
};

const Header = ({ onLogout, storeLoading }: Props) => {
  const { storeId, outletId, storePrefix } = useParams<{ storeId: string; outletId: string; storePrefix: string }>();
  const [toggle, SetToggle] = useState(false);
  const user = useAppSelector((state) => state.user.data);
  const stores = useAppSelector((state) => state.stores.data);

  const canAccessSettings =
    user?.issysgenmasteraccount === 1 ||
    (user?.permissions?.menus as Menus | undefined)?.some(
      (m) => m.menuurl?.startsWith("/settings") ||
             m.children?.some((c) => c.menuurl?.startsWith("/settings"))
    );

  // Resolve current outlet name from Redux (available immediately after stores load)
  const currentOutletName = (() => {
    if (outletId) {
      for (const s of stores) {
        const o = s.outlets?.find((o) => o.outletid === Number(outletId));
        if (o) return o.outletname;
      }
    }
    for (const s of stores) {
      const o = s.outlets?.find((o) => o.isenabled && o.isdefaultoutlet);
      if (o) return o.outletname;
    }
    return stores[0]?.outlets?.[0]?.outletname ?? null;
  })();

  // Fetch full outlet details for logo only
  const currentStoreId = storeId
    ? parseInt(storeId as string, 10)
    : stores[0]?.storeid
    ? Number(stores[0].storeid)
    : null;

  const currentOutletId = outletId ? Number(outletId) : null;

  const { data: outletsData } = useQuery(GET_OUTLETS_QUERY, {
    variables: { storeid: [currentStoreId] },
    skip: !currentStoreId,
    fetchPolicy: "cache-first",
  });

  const currentOutletDetail = outletsData?.getOutlets?.find(
    (o: { outletid: number }) =>
      o.outletid === (currentOutletId ?? outletsData.getOutlets[0]?.outletid)
  ) ?? null;

  const outletLogo: string | null = currentOutletDetail?.storelogo ?? null;
  const outletAddress: string | null = [
    currentOutletDetail?.address,
    currentOutletDetail?.city,
  ]
    .filter(Boolean)
    .join(", ") || null;

  const defaultPage = (() => {
    if (!storeId || !outletId) return `/jw/home`;
    const base = `/jw/${storeId}/${outletId}`;
    const role = user?.role?.toLowerCase();
    if (role === "admin") return `${base}/dashboard/admin`;
    if (role === "manager") return `${base}/dashboard/manager`;
    if (role === "cashier") return `${base}/dashboard/cashier`;
    return `${base}/home`;
  })();

  const isElementVisible = (element: HTMLElement | null): boolean => {
    if (!element) return false;
    return element.offsetWidth > 0 || element.offsetHeight > 0;
  };
  useEffect(() => {
    const handleMouseover = (e: MouseEvent) => {
      e.stopPropagation();

      const body = document.body;
      const toggleBtn = document.getElementById("toggle_btn");

      if (
        body.classList.contains("mini-sidebar") &&
        isElementVisible(toggleBtn)
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("mouseover", handleMouseover);

    return () => {
      document.removeEventListener("mouseover", handleMouseover);
    };
  }, []);
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as Document & { mozFullScreenElement?: Element })
          .mozFullScreenElement ||
        (document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement ||
        (document as Document & { msFullscreenElement?: Element })
          .msFullscreenElement;
      // setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);
  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    SetToggle((current) => !current);
  };
  const expandMenu = () => {
    document.body.classList.remove("expand-menu");
  };
  const expandMenuOpen = () => {
    document.body.classList.add("expand-menu");
  };
  const sidebarOverlay = () => {
    document?.querySelector(".main-wrapper")?.classList?.toggle("slide-nav");
    document?.querySelector(".sidebar-overlay")?.classList?.toggle("opened");
    document?.querySelector("html")?.classList?.toggle("menu-opened");
  };

  const pathname = location.pathname;

  if (!user) {
    return;
  }

  return (
    <>
      <div className="header">
        {/* Logo */}
        <div
          className={`header-left ${toggle ? "" : "active"}`}
          onMouseLeave={expandMenu}
          onMouseOver={expandMenuOpen}
        >
          <Link href={defaultPage} className="logo logo-normal">
            <Image
              src="/assets/img/logo.png"
              alt="img"
              width={140}
              height={30}
            />
          </Link>
          <Link href={defaultPage} className="logo logo-white">
            <Image
              src="/assets/img/logo-white.png"
              alt="img"
              width={140}
              height={30}
            />
          </Link>
          <Link href={defaultPage} className="logo-small">
            <Image
              src="/assets/img/logo-small.png"
              alt="img"
              width={30}
              height={30}
            />
          </Link>
          <Link
            id="toggle_btn"
            href="#"
            style={{
              display:
                pathname.includes("tasks") || pathname.includes("pos")
                  ? "none"
                  : pathname.includes("compose")
                  ? "none"
                  : "",
            }}
            onClick={handlesidebar}
          >
            <ChevronsLeft className="feather-16" />
          </Link>
        </div>
        {/* /Logo */}
        {/* Outlet title */}
        {currentOutletName && (
          <div
            className="d-none d-lg-flex"
            style={{
              float: "left",
              height: "66px",
              alignItems: "center",
              gap: 12,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            {outletLogo && (
              <Image
                src={outletLogo}
                alt={currentOutletName}
                width={40}
                height={40}
                unoptimized
                style={{ objectFit: "contain", borderRadius: 6 }}
              />
            )}
            <div style={{ lineHeight: 1.2 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1e293b",
                  letterSpacing: "-0.3px",
                  whiteSpace: "nowrap",
                }}
              >
                {currentOutletName}
              </div>
              {outletAddress && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6c757d",
                    whiteSpace: "nowrap",
                    marginTop: 1,
                  }}
                >
                  {outletAddress}
                </div>
              )}
            </div>
          </div>
        )}
        {/* /Outlet title */}
        <Link
          id="mobile_btn"
          className="mobile_btn"
          href="#"
          onClick={sidebarOverlay}
        >
          <span className="bar-icon">
            <span />
            <span />
            <span />
          </span>
        </Link>
        {/* Header Menu */}
        <ul className="nav user-menu">
          {/* Search */}
          <li className="nav-item nav-searchinputs">
            {/* <div className="top-nav-search">
              <Link href="#" className="responsive-search">
                <Search />
              </Link>
              <form action="#" className="dropdown">
                <div
                  className="searchinputs dropdown-toggle"
                  id="dropdownMenuClickable"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="false"
                >
                  <input type="text" placeholder="Search" />
                  <div className="search-addon">
                    <span>
                      <XCircle className="feather-14" />
                    </span>
                  </div>
                </div>
                <div
                  className="dropdown-menu search-dropdown"
                  aria-labelledby="dropdownMenuClickable"
                >
                  <div className="search-info">
                    <h6>
                      <span>
                        <i data-feather="search" className="feather-16" />
                      </span>
                      Recent Searches
                    </h6>
                    <ul className="search-tags">
                      <li>
                        <Link href="#">Products</Link>
                      </li>
                      <li>
                        <Link href="#">Sales</Link>
                      </li>
                      <li>
                        <Link href="#">Applications</Link>
                      </li>
                    </ul>
                  </div>
                  <div className="search-info">
                    <h6>
                      <span>
                        <i data-feather="help-circle" className="feather-16" />
                      </span>
                      Help
                    </h6>
                    <p>
                      How to Change Product Volume from 0 to 200 on Inventory
                      management
                    </p>
                    <p>Change Product Name</p>
                  </div>
                  <div className="search-info">
                    <h6>
                      <span>
                        <i data-feather="user" className="feather-16" />
                      </span>
                      Customers
                    </h6>
                    <ul className="customers">
                      <li>
                        <Link href="#">
                          Aron Varu
                          <img
                            src="assets/img/profiles/avator1.jpg"
                            alt=""
                            className="img-fluid"
                          />
                        </Link>
                      </li>
                      <li>
                        <Link href="#">
                          Jonita
                          <img
                            src="assets/img/profiles/avatar-01.jpg"
                            alt=""
                            className="img-fluid"
                          />
                        </Link>
                      </li>
                      <li>
                        <Link href="#">
                          Aaron
                          <img
                            src="assets/img/profiles/avatar-10.jpg"
                            alt=""
                            className="img-fluid"
                          />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </form>
            </div> */}
          </li>
          <StoreDropdown storeLoading={storeLoading} />

          {/* Flag */}
          {/* <li className="nav-item dropdown has-arrow flag-nav nav-item-box">
            <Link
              className="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
              href="#"
              role="button"
            >
              <i data-feather="globe" />
              <Globe />
              <img src="assets/img/flags/us.png" alt="img" height={16} />
            </Link>
            <div className="dropdown-menu dropdown-menu-right">
              <Link href="#" className="dropdown-item active">
                <img src="assets/img/flags/us.png" alt="img" height={16} />
                English
              </Link>
              <Link href="#" className="dropdown-item">
                <img src="assets/img/flags/fr.png" alt="img" height={16} />{" "}
                French
              </Link>
              <Link href="#" className="dropdown-item">
                <img src="assets/img/flags/es.png" alt="img" height={16} />{" "}
                Spanish
              </Link>
              <Link href="#" className="dropdown-item">
                <img src="assets/img/flags/de.png" alt="img" height={16} />{" "}
                German
              </Link>
            </div>
          </li> */}
          {/* /Flag */}
          {/* <li className="nav-item nav-item-box">
            <Link
              href="#"
              id="btnFullscreen"
              // onClick={() => toggleFullscreen()}
              className={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
            >
              <i data-feather="maximize" />
              <Maximize />
            </Link>
          </li> */}
          {/* <li className="nav-item nav-item-box">
            <Link href="/email">
              <i data-feather="mail" />
              <Mail />
              <span className="badge rounded-pill">1</span>
            </Link>
          </li> */}
          {/* Notifications */}
          {/* <li className="nav-item dropdown nav-item-box">
            <Link
              href="#"
              className="dropdown-toggle nav-link"
              data-bs-toggle="dropdown"
            >
              <i data-feather="bell" />
              <Bell />
              <span className="badge rounded-pill">2</span>
            </Link>
            <div className="dropdown-menu notifications">
              <div className="topnav-dropdown-header">
                <span className="notification-title">Notifications</span>
                <Link href="#" className="clear-noti">
                  {" "}
                  Clear All{" "}
                </Link>
              </div>
              <div className="noti-content">
                <ul className="notification-list">
                  <li className="notification-message active">
                    <Link href="/activities">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0">
                          <img
                            alt="img"
                            src="assets/img/profiles/avatar-02.jpg"
                          />
                        </span>
                        <div className="media-body flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">John Doe</span> added
                            new task{" "}
                            <span className="noti-title">
                              Patient appointment booking
                            </span>
                          </p>
                          <p className="noti-time">
                            <span className="notification-time">
                              4 mins ago
                            </span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link href="/activities">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0">
                          <img
                            alt="img"
                            src="assets/img/profiles/avatar-03.jpg"
                          />
                        </span>
                        <div className="media-body flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">Tarah Shropshire</span>{" "}
                            changed the task name{" "}
                            <span className="noti-title">
                              Appointment booking with payment gateway
                            </span>
                          </p>
                          <p className="noti-time">
                            <span className="notification-time">
                              6 mins ago
                            </span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link href="/activities">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0">
                          <img
                            alt="img"
                            src="assets/img/profiles/avatar-06.jpg"
                          />
                        </span>
                        <div className="media-body flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">Misty Tison</span>{" "}
                            added{" "}
                            <span className="noti-title">Domenic Houston</span>{" "}
                            and <span className="noti-title">Claire Mapes</span>{" "}
                            to project{" "}
                            <span className="noti-title">
                              Doctor available module
                            </span>
                          </p>
                          <p className="noti-time">
                            <span className="notification-time">
                              8 mins ago
                            </span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link href="/activities">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0">
                          <img
                            alt="img"
                            src="assets/img/profiles/avatar-17.jpg"
                          />
                        </span>
                        <div className="media-body flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">Rolland Webber</span>{" "}
                            completed task{" "}
                            <span className="noti-title">
                              Patient and Doctor video conferencing
                            </span>
                          </p>
                          <p className="noti-time">
                            <span className="notification-time">
                              12 mins ago
                            </span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link href="/activities">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0">
                          <img
                            alt="img"
                            src="assets/img/profiles/avatar-13.jpg"
                          />
                        </span>
                        <div className="media-body flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">Bernardo Galaviz</span>{" "}
                            added new task{" "}
                            <span className="noti-title">
                              Private chat module
                            </span>
                          </p>
                          <p className="noti-time">
                            <span className="notification-time">
                              2 days ago
                            </span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="topnav-dropdown-footer">
                <Link href="/activities">View all Notifications</Link>
              </div>
            </div>
          </li> */}
          {/* /Notifications */}
          {/* <li className="nav-item nav-item-box">
            <Link href="/general-settings">
              <i data-feather="settings" />
              <Settings />
            </Link>
          </li> */}
          <li className="nav-item dropdown has-arrow main-drop">
            <Link
              href="#"
              className="dropdown-toggle nav-link userset"
              data-bs-toggle="dropdown"
            >
              <span className="user-info">
                <span className="user-letter">
                  <User />
                </span>
                <span className="user-detail">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </span>
              </span>
            </Link>
            <div className="dropdown-menu menu-drop-user">
              <div className="profilename">
                <div className="profileset">
                  <span className="user-img">
                    <User />
                    <span className="status online" />
                  </span>
                  <div className="profilesets">
                    <h6>{user.name}</h6>
                    <h5>{user.email}</h5>
                  </div>
                </div>
                <hr className="m-0" />
                <Link className="dropdown-item" href={storeId && outletId ? `/${storePrefix}/${storeId}/${outletId}/profile` : "#"}>
                  <User className="me-2" /> My Profile
                </Link>
                {canAccessSettings && (
                  <Link className="dropdown-item" href={storeId && outletId ? `/${storePrefix}/${storeId}/${outletId}/settings/system_settings` : "#"}>
                    <Settings className="me-2" />
                    Settings
                  </Link>
                )}
                <hr className="m-0" />
                <Link
                  className="dropdown-item logout pb-0"
                  href="#"
                  onClick={onLogout}
                >
                  <LogOut />
                  Logout
                </Link>
              </div>
            </div>
          </li>
        </ul>
        {/* /Header Menu */}
        {/* Mobile Menu */}
        <div className="dropdown mobile-user-menu">
          <Link
            href="#"
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa fa-ellipsis-v" />
          </Link>
          <div className="dropdown-menu dropdown-menu-right">
            <Link className="dropdown-item" href={storeId && outletId ? `/${storePrefix}/${storeId}/${outletId}/profile` : "#"}>
              My Profile
            </Link>
            {canAccessSettings && (
              <Link className="dropdown-item" href={storeId && outletId ? `/${storePrefix}/${storeId}/${outletId}/settings/system_settings` : "#"}>
                Settings
              </Link>
            )}
            <Link className="dropdown-item" href="#" onClick={onLogout}>
              Logout
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
