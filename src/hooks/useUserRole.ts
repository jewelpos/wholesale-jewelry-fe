"use client";

import { useAppSelector } from "@/lib/store/hook";
import { USER_ROLES, UserRole } from "@/lib/config/constants";

export function useUserRole() {
  const role = useAppSelector((state) => state.user.data?.role as UserRole | undefined);

  const isAdmin = role === USER_ROLES.Admin;
  const isManager = role === USER_ROLES.Manager;
  const isCashier = role === USER_ROLES.Cashier;

  // Admin + Manager — matches backend ALLOWED_ACCESS_LEVELS.Manager
  const isAtLeastManager = isAdmin || isManager;

  return { role, isAdmin, isManager, isCashier, isAtLeastManager };
}
