"use client";

import React, { createContext, useCallback, useContext, useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export interface NavigationGuard {
  /** Cheap, synchronous check — called on every navigation attempt. */
  isDirty: () => boolean;
  /** Runs the form's own save flow (including its own success notification/navigation,
   * e.g. router.back()) — the guard does NOT separately navigate after Save, since the
   * form's own post-save redirect and "wherever the user actually clicked" are two
   * different destinations and the form's own flow should win. */
  onSave: () => void | Promise<void>;
  /** Discards in-memory changes (e.g. reset()) — after this, the guard proceeds with
   * whatever navigation was originally requested. */
  onDiscard: () => void;
}

interface NavigationGuardContextValue {
  registerGuard: (guard: NavigationGuard) => () => void;
  /** Sidebar/nav links should call this instead of navigating directly. Runs `navigate`
   * immediately if nothing is registered or nothing is dirty; otherwise asks the user
   * to Save, Discard, or Cancel before proceeding. */
  guardedNavigate: (navigate: () => void) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export const NavigationGuardProvider = ({ children }: { children: React.ReactNode }) => {
  const guardRef = useRef<NavigationGuard | null>(null);

  const registerGuard = useCallback((guard: NavigationGuard) => {
    guardRef.current = guard;
    return () => {
      if (guardRef.current === guard) guardRef.current = null;
    };
  }, []);

  const guardedNavigate = useCallback((navigate: () => void) => {
    const guard = guardRef.current;
    if (!guard || !guard.isDirty()) {
      navigate();
      return;
    }
    MySwal.fire({
      title: "Unsaved changes",
      text: "Save your changes before leaving, or discard them?",
      icon: "warning",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Save",
      denyButtonText: "Discard",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // The form's own onSave already navigates on success (and stays put, with the
        // dialog just closed, if the save fails) — nothing further to do here.
        void guard.onSave();
      } else if (result.isDenied) {
        guard.onDiscard();
        navigate();
      }
      // Cancel: do nothing — stay exactly where they are.
    });
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, guardedNavigate }}>
      {children}
    </NavigationGuardContext.Provider>
  );
};

export const useNavigationGuard = () => {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error("useNavigationGuard must be used within a NavigationGuardProvider");
  }
  return ctx;
};
