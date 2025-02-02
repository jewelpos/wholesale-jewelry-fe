import React from "react";
import "../../styles/scss/components/_loader.scss";

const FullPageLoader = () => {
  return (
    <div className="full-page-container">
      <div className="spinner-grow text-primary me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <div className="spinner-grow text-secondary me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <div className="spinner-grow text-success me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <div className="spinner-grow text-danger me-1" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default FullPageLoader;
