"use client";

import React from "react";

type Props = {
  loading: boolean;
  btnText: string;
  loadingText?: string;
  type?: "submit" | "button" | "reset";
  className?: string;
};

const ButtonLoader = ({
  loading,
  btnText,
  loadingText,
  type = "submit",
  className = "btn btn-primary",
}: Props) => {
  return (
    <button type={type} disabled={loading} className={className}>
      {loading ? (
        <>
          <i className="fas fa-spinner fa-spin me-2" /> {loadingText}
        </>
      ) : (
        btnText
      )}
    </button>
  );
};

export default ButtonLoader;
