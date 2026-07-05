import {
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
  SizeColumnsToContentStrategy,
} from "ag-grid-community";
import { useMemo } from "react";

const useAutoSizeAggrid = () => {
  // Use fitGridWidth so the grid fills available space without auto-sizing
  // individual columns — this avoids collapsing custom cell renderer columns
  // (like Actions) to header-text width before the React components mount.
  const autoSizeStrategy = useMemo<
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy
  >(() => {
    return {
      type: "fitGridWidth",
    };
  }, []);

  return {
    autoSizeStrategy,
  };
};

export default useAutoSizeAggrid;
