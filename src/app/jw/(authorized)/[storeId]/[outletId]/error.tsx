"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="alert alert-danger text-center" style={{ maxWidth: 480 }}>
        <h5 className="mb-2">Something went wrong</h5>
        <p className="mb-3 text-muted small">{error.message}</p>
        <button className="btn btn-sm btn-outline-danger" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
