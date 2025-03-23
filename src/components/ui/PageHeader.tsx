import React from "react";
import Breadcrumb from "./Breadcrumb";

type Props = {
  title: string;
  para?: string;
  showBreadcrumb?: boolean;
};

const PageHeader = ({ title, para, showBreadcrumb }: Props) => {
  return (
    <div className="page-header">
      <div className="add-item d-flex">
        <div className="page-title">
          <h4>{title}</h4>
          {para && <h6 className="mb-3">{para}</h6>}
          {showBreadcrumb && <Breadcrumb />}
        </div>
      </div>
      {/* <div className="page-btn">{showBreadcrumb && <Breadcrumb />}</div> */}
    </div>
  );
};

export default PageHeader;
