"use client";

import { useEffect } from "react";

export default function ReactScanProvider() {
  useEffect(() => {
    // Only initialize in development
    if (process.env.NODE_ENV === "development") {
      import("react-scan").then(({ scan }) => {
        scan({
          enabled: true,
          log: true,
        });
      });
    }
  }, []);

  return null;
}
