"use client";

import React from "react";

type Props = {
  loading: boolean;
  btnText: string;
  loadingText?: string;
  type?: "submit" | "button" | "reset";
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const ButtonLoader = ({
  loading,
  btnText,
  loadingText,
  type = "submit",
  className = "btn btn-primary",
  style,
  disabled = false,
  onClick,
}: Props) => {
  return (
    <button type={type} disabled={loading || disabled} className={className} style={style} onClick={onClick}>
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
