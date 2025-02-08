import React from "react";
import "../../styles/scss/components/_loader.scss";

const FullPageLoader = () => {
  return (
    <div className="full-page-container">
      <div className="spinner-grow loader-primary-1 me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <div className="spinner-grow loader-primary-2 me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <div className="spinner-grow loader-primary-3 me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <div className="spinner-grow loader-primary-4 me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default FullPageLoader;
