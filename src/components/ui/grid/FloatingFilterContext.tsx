"use client";

import React, { createContext, useContext, useState } from "react";

interface FloatingFilterContextValue {
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
}

const FloatingFilterContext = createContext<FloatingFilterContextValue>({
  showFilters: false,
  setShowFilters: () => {},
});

export const FloatingFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [showFilters, setShowFilters] = useState(false);
  return (
    <FloatingFilterContext.Provider value={{ showFilters, setShowFilters }}>
      {children}
    </FloatingFilterContext.Provider>
  );
};

export const useFloatingFilter = () => useContext(FloatingFilterContext);
