"use client";

import { useEffect } from "react";

const BootstrapJS = () => {
  useEffect(() => {
    // Dynamically load the Bootstrap JS bundle on the client side
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null; // This component does not render anything
};

export default BootstrapJS;
