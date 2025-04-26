import React from "react";

const Footer: React.FC = () => (
  <footer className="container-fluid mt-4">
    <div className="d-flex justify-content-between align-items-center py-2 border-top text-muted small">
      <div>&copy; {new Date().getFullYear()} Jewel Wholesale</div>
      <div>
        Designed by{" "}
        <a
          href="https://yourdesignerurl.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Your Designer
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
