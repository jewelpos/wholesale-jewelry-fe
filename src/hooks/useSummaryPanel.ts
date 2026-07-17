"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store/hook";

export function useSummaryPanel(key: string, panelHeight = 175) {
  const user = useAppSelector((state) => state.user.data);
  const isAdmin = user?.roleid === 1 || !!user?.issysgenmasteraccount;

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
  const panelOffset = isAdmin && !isCollapsed ? panelHeight : 0;

  return { isAdmin, isCollapsed, toggle, panelOffset };
}
