import { HEIGHT_BUFFER_SIZE } from "@/lib/config/constants";
import { useState, useEffect, ReactNode } from "react";

export const GridWrapper = ({ children }: { children: ReactNode }) => {
  const [gridHeight, setGridHeight] = useState<number>(
    window.innerHeight - HEIGHT_BUFFER_SIZE
  );

  useEffect(() => {
    const handleResize = () => {
      setGridHeight(window.innerHeight - HEIGHT_BUFFER_SIZE);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <div style={{ height: `${gridHeight}px` }}>{children}</div>;
};
