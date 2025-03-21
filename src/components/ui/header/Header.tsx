"use client";

import { useAppSelector } from "@/lib/store/hook";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  Settings,
  User,
  XCircle,
  ChevronsLeft,
  Globe,
  Maximize,
  Mail,
  Bell,
  LogOut,
} from "react-feather";
import StoreDropdown from "./StoreDropdown";
import { useParams } from "next/navigation";

type Props = {
  onLogout: () => Promise<boolean | void>;
  storeLoading: boolean;
};

const Header = ({ onLogout, storeLoading }: Props) => {
  const { storeId } = useParams();
  const [toggle, SetToggle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const user = useAppSelector((state) => state.user.data);
  const defaultPage = storeId ? `/jw/${storeId}/home` : `/jw/home`;

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
      setIsFullscreen(!!fullscreenElement);
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
                <Link className="dropdown-item" href="">
                  <User className="me-2" /> My Profile
                </Link>
                <Link className="dropdown-item" href="">
                  <Settings className="me-2" />
                  Settings
                </Link>
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
            <Link className="dropdown-item" href="profile">
              My Profile
            </Link>
            <Link className="dropdown-item" href="generalsettings">
              Settings
            </Link>
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
