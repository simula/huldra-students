import React, { useMemo } from "react";
import config from "./config.json";
import { SIZE_MAP } from "./perfHelpers";
import { usePerformanceMetrics } from "./hooks/usePerformanceMetrics";
import { getAssetDownloadUrl } from "./utils/onedrive";

/**
 * PerformanceMetricsOneDrive
 * Thin wrapper that provides OneDrive-specific URL builder to the shared metrics hook.
 */
export default function PerformanceMetricsOneDrive({ currentRoute }) {
  // Provider name from config (e.g., "onedrive")
  const providerName = useMemo(
    () => config.REACT_APP_general.storage.assetsStorageType,
    []
  );

  // URL builder: maps filenames to OneDrive download URLs
  const buildUrls = useMemo(() => {
    return async (caseDir) => {
      const prefix = `${caseDir}-`;
      const files = Object.keys(SIZE_MAP).filter((fileName) =>
        fileName.startsWith(prefix)
      );
      // Fetch direct download URLs from helper
      const urls = await Promise.all(
        files.map((fileName) =>
          getAssetDownloadUrl(`/gallery/cases/${caseDir}/${fileName}`)
        )
      );
      return urls;
    };
  }, []);

  // Delegate all metric capture and CSV download to the shared hook
  usePerformanceMetrics({ currentRoute, providerName, buildUrls });

  return null;
}