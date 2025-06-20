import React, { useMemo } from "react";
import config from "./config.json";
import { SIZE_MAP } from "./perfHelpers";
import { usePerformanceMetrics } from "./hooks/usePerformanceMetrics";

/**
 * PerformanceMetricsAzure
 * Thin wrapper that provides Azure-specific URL builder to the shared metrics hook.
 */
export default function PerformanceMetricsAzure({ currentRoute }) {
  // Memoize provider name, base URL and SAS token
  const providerName = useMemo(
    () => config.REACT_APP_general.storage.assetsStorageType,
    []
  );
  const azureBase = useMemo(
    () => config.REACT_APP_general.storage.azureBlobUrl,
    []
  );
  const sasToken = useMemo(
    () => config.REACT_APP_general.storage.azureSasToken,
    []
  );

  // URL builder for Azure-hosted files, appending SAS token
  const buildUrls = useMemo(() => {
    return (caseDir) => {
      if (!azureBase || !sasToken) {
        console.warn("Azure base URL or SAS token not defined in config");
        return [];
      }
      const prefix = `${caseDir}-`;
      return Object.keys(SIZE_MAP)
        .filter((fileName) => fileName.startsWith(prefix))
        .map((fileName) => `${azureBase}/${caseDir}/${fileName}${sasToken}`);
    };
  }, [azureBase, sasToken]);

  // Delegate metric capture to shared hook
  usePerformanceMetrics({ currentRoute, providerName, buildUrls });

  return null;
}