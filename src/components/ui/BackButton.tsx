"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { ArrowLeft } from "react-feather";

const BackButton = () => {
  const router = useRouter();
  return (
    <div className="mb-2">
      <Link href={"#"} onClick={() => router.back()}>
        <ArrowLeft size={20} />
        &nbsp;Back
      </Link>
    </div>
  );
};

export default BackButton;
