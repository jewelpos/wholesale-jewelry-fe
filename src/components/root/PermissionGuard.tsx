"use client";

import { ReactNode } from "react";
import { usePermissionCheck } from "@/hooks/usePermissionsCheck";

export function PermissionGuard({ children }: { children: ReactNode }) {
  usePermissionCheck();
  return <>{children}</>;
}
