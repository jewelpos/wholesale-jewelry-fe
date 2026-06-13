"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * Flex column container that fills the available page height (viewport minus navbar + content padding).
 * Use as the outermost wrapper in report pages. The last child (the grid card) should carry
 * `style={{ flex: 1, minHeight: 0 }}` so it stretches to fill remaining space.
 */
export default function ReportLayout({ children }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 150px)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
