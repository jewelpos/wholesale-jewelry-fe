"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { MoreVertical } from "react-feather";

export type RowActionItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  dangerous?: boolean;
};

type DropPos = { top: number; left: number };

const RowActionsWrapper = ({
  children,
  items,
}: {
  children: React.ReactNode;
  items: RowActionItem[];
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropPos>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const openMenu = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 2,
      left: r.right + window.scrollX,
    });
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        btnRef.current && btnRef.current.contains(e.target as Node)
      ) return;
      if (
        menuRef.current && menuRef.current.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const dropdown =
    open && typeof document !== "undefined"
      ? ReactDOM.createPortal(
          <ul
            ref={menuRef}
            className="dropdown-menu show"
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              transform: "translateX(-100%)",
              zIndex: 9999,
              minWidth: 170,
              boxShadow: "0 4px 16px rgba(0,0,0,.15)",
            }}
          >
            {items.map((item) =>
              item.disabled ? (
                <li key={item.key}>
                  <span
                    className="dropdown-item disabled d-flex align-items-center gap-2"
                    title={item.disabledReason}
                    style={{ opacity: 0.45, cursor: "not-allowed", fontSize: 13 }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </li>
              ) : item.href ? (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`dropdown-item d-flex align-items-center gap-2${item.dangerous ? " text-danger" : ""}`}
                    style={{ fontSize: 13 }}
                    onClick={() => setOpen(false)}
                    scroll={false}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ) : (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`dropdown-item d-flex align-items-center gap-2${item.dangerous ? " text-danger" : ""}`}
                    style={{ fontSize: 13 }}
                    onClick={() => { item.onClick?.(); setOpen(false); }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            )}
          </ul>,
          document.body
        )
      : null;

  return (
    <div className="action-table-data" style={{ height: "100%", display: "flex", alignItems: "center" }}>
      {/* Desktop (≥ lg): existing icon buttons — unchanged */}
      <div className="edit-delete-action d-none d-lg-flex" style={{ gap: "2px", alignItems: "center" }}>
        {children}
      </div>

      {/* Mobile (< lg): compact ⋮ trigger + portal dropdown */}
      {items.length > 0 && (
        <div className="d-lg-none" style={{ display: "flex", alignItems: "center" }}>
          <button
            ref={btnRef}
            type="button"
            onClick={() => (open ? setOpen(false) : openMenu())}
            aria-label="Actions"
            style={{
              padding: "2px 5px",
              lineHeight: 1,
              background: "transparent",
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 22,
              width: 26,
            }}
          >
            <MoreVertical size={12} />
          </button>
          {dropdown}
        </div>
      )}
    </div>
  );
};

export default RowActionsWrapper;
