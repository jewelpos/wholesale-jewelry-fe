"use client";

import React from "react";

const FeatherIcon = ({ icon }: { icon: string }) => (
  <i className={`feather-${icon} me-2`} data-feather={icon} />
);

export default FeatherIcon;
