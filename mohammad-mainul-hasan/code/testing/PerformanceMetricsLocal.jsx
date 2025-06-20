import React, { useMemo } from "react";
import config from "./config.json";
import { SIZE_MAP } from "./perfHelpers";
import { usePerformanceMetrics } from "./hooks/usePerformanceMetrics";

/**
 * PerformanceMetricsLocal
 * Thin wrapper that provides local URL builder to the shared metrics hook.
 */
export default function PerformanceMetricsLocal({ currentRoute }) {
  // Extract providerName from config
  const providerName = useMemo(
    () => config.REACT_APP_general.storage.assetsStorageType,
    []
  );

  // Build URLs for local assets under /gallery/cases
  const buildUrls = useMemo(() => {
    const origin = window.location.origin;
    return (caseDir) => {
      const prefix = `${caseDir}-`;
      return Object.keys(SIZE_MAP)
        .filter((fileName) => fileName.startsWith(prefix))
        .map((fileName) => `${origin}/gallery/cases/${caseDir}/${fileName}`);
    };
  }, []);

  // Delegate performance metrics capture to shared hook
  usePerformanceMetrics({ currentRoute, providerName, buildUrls });

  return null;
}