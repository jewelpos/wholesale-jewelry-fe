"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export type ActionDef = {
  key: string;
  label: string;
  icon?: string;
  colorClass: string;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  keepOnMobile?: boolean;
  style?: React.CSSProperties;
};

/* JS-based breakpoint — avoids Bootstrap d-none conflicts with DreamPos theme CSS */
const useIsDesktop = () => {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const check = () => setDesktop(window.innerWidth >= 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return desktop;
};

const ActionBtn = ({ action, showLabel }: { action: ActionDef; showLabel: boolean }) => (
  <Link
    href={action.disabled ? "#" : action.href}
    title={action.label}
    onClick={(e) => {
      if (action.disabled) { e.preventDefault(); return; }
      action.onClick?.(e);
    }}
    className={`btn btn-added ${action.colorClass}${action.disabled ? " disabled" : ""}`}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
      whiteSpace: "nowrap",
      margin: 0,
      ...action.style,
    }}
  >
    {action.icon ? (
      <>
        <i className={`feather-${action.icon}`} data-feather={action.icon} />
        {showLabel && <span style={{ marginLeft: 6 }}>{action.label}</span>}
      </>
    ) : (
      /* No feather icon defined — show text only on desktop */
      showLabel ? <span>{action.label}</span> : null
    )}
  </Link>
);

const MobileActionsDropdown = ({ actions }: { actions: ActionDef[] }) => {
  const showLabel = useIsDesktop();

  return (
    /* Pure inline flex — no DreamPos page-btn/purchase-pg-btn classes
       which apply margin-top: 20px on screens < 575 px and break alignment */
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {actions.map((a) => (
        <ActionBtn key={a.key} action={a} showLabel={showLabel} />
      ))}
    </div>
  );
};

export default MobileActionsDropdown;
