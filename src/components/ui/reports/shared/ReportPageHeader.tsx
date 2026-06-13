"use client";

import PageHeader from "@/components/ui/PageHeader";
import useMenu from "@/hooks/useMenu";

const ReportPageHeader = () => {
  const { currentMenu } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    />
  );
};

export default ReportPageHeader;
