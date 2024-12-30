import { Fragment } from "react";

const Sidebar = () => {
  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu" className="sidebar-menu">
          <ul>
            <li className="submenu-open">
              <h6 className="submenu-hdr">One</h6>
              <ul>
                {" "}
                <li className={`submenu custom-active-hassubroute-false`}>1</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
