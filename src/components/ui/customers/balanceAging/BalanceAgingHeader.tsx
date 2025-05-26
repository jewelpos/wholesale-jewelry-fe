"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";

const BalanceAgingHeader = () => {
  const { currentMenu } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    />
  );
};

export default BalanceAgingHeader;
