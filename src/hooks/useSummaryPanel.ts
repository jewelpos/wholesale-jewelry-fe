"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store/hook";

const PANEL_HEIGHT = 175; // px added to heightOffset when panel is expanded (toggle + cards + chips + wrapper margin)

export function useSummaryPanel(key: string) {
  const user = useAppSelector((state) => state.user.data);
  const isAdmin = user?.roleid === 1;

  const storageKey = `summary_panel_${key}`;
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "collapsed";
  });

  const toggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, next ? "collapsed" : "expanded");
    }
  };

  // Extra px to add to POSGrid heightOffset when panel is visible
  const panelOffset = isAdmin && !isCollapsed ? PANEL_HEIGHT : 0;

  return { isAdmin, isCollapsed, toggle, panelOffset };
}
