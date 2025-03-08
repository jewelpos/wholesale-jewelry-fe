"use client";

import useDefaultRoute from "@/hooks/useDefaultRoute";
import Link from "next/link";
import React from "react";
import { PlusCircle } from "react-feather";

const AddUserButton = () => {
  const { basePath } = useDefaultRoute();
  return (
    <Link href={`${basePath}/users/add`} className="btn  btn-primary">
      <PlusCircle className="me-2 text-white" />
      Add user
    </Link>
  );
};

export default AddUserButton;
