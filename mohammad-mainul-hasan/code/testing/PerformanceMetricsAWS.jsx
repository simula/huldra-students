import React, { useMemo } from "react";
import config from "./config.json";
import { SIZE_MAP } from "./perfHelpers";
import { usePerformanceMetrics } from "./hooks/usePerformanceMetrics";

/**
 * PerformanceMetricsAWS
 * Thin wrapper that provides AWS-specific URL builder to the shared metrics hook.
 */
export default function PerformanceMetricsAWS({ currentRoute }) {
  // Memoize provider name and base URL
  const providerName = useMemo(
    () => config.REACT_APP_general.storage.assetsStorageType,
    []
  );
  const baseUrl = useMemo(
    () => config.REACT_APP_general.storage.awsBucketUrl,
    []
  );

  // URL builder for AWS-hosted files
  const buildUrls = useMemo(() => {
    return (caseDir) => {
      if (!baseUrl) {
        console.warn("AWS bucket URL not defined in config");
        return [];
      }
      const prefix = `${caseDir}-`;
      return Object.keys(SIZE_MAP)
        .filter((fileName) => fileName.startsWith(prefix))
        .map((fileName) => `${baseUrl}/${caseDir}/${fileName}`);
    };
  }, [baseUrl]);

  // Delegate metric capture to shared hook
  usePerformanceMetrics({ currentRoute, providerName, buildUrls });

  return null;
}