"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";

const InventoryAdjustmentsHeader = () => {
  const { currentMenu } = useMenu();
  console.log(currentMenu);
  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Inventory Adjustments"}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    />
  );
};

export default InventoryAdjustmentsHeader;
