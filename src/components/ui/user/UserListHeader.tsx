"use client";

import React from "react";
import PageHeader from "../PageHeader";
import FeatherIcon from "../FeatherIcon";
import Link from "next/link";
import useDefaultRoute from "@/hooks/useDefaultRoute";

const UserListHeader = () => {
  const { basePath } = useDefaultRoute();
  return (
    <PageHeader title="Users" subtitle="User List" showBreadcrumb>
      <div className="d-flex purchase-pg-btn">
        <div className="page-btn d-none d-sm-block">
          <Link href={`${basePath}/users/new`} className={`btn btn-added`}>
            <FeatherIcon icon="plus" />
            Add New User
          </Link>
        </div>
      </div>
    </PageHeader>
  );
};

export default UserListHeader;
