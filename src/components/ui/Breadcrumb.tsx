"use client";

import Link from "next/link";
import React from "react";

const Breadcrumb = () => {
  return (
    <nav aria-label="breadcrumb" className="mb-3">
      <ol className="breadcrumb breadcrumb-arrow mb-0">
        <li className="breadcrumb-item">
          <Link href="/jw/home">Home</Link>
        </li>
        <li className="breadcrumb-item active" aria-current="page">
          Create store
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumb;
