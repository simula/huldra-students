import React, { useMemo } from "react";
import config from "./config.json";
import { SIZE_MAP } from "./perfHelpers";
import { usePerformanceMetrics } from "./hooks/usePerformanceMetrics";

/**
 * PerformanceMetricsDropbox
 * Thin wrapper that provides Dropbox-specific URL builder to the shared metrics hook.
 */
export default function PerformanceMetricsDropbox({ currentRoute }) {
  // Provider name (e.g., "dropbox")
  const providerName = useMemo(
    () => config.REACT_APP_general.storage.assetsStorageType,
    []
  );

  // Base fallback origin for local files
  const origin = useMemo(() => window.location.origin, []);

  // Mapping of filenames to Dropbox shared links (from config)
  const dropboxLinks = useMemo(
    () => config.REACT_APP_general.storage.dropboxLinks || {},
    []
  );

  // URL builder: use Dropbox link if available, otherwise fallback to local gallery path
  const buildUrls = useMemo(() => {
    return (caseDir) => {
      const prefix = `${caseDir}-`;
      return Object.keys(SIZE_MAP)
        .filter((fileName) => fileName.startsWith(prefix))
        .map((fileName) => {
          const link = dropboxLinks[fileName];
          return link ? link : `${origin}/gallery/cases/${caseDir}/${fileName}`;
        });
    };
  }, [origin, dropboxLinks]);

  // Delegate all metric capture and CSV download to the shared hook
  usePerformanceMetrics({ currentRoute, providerName, buildUrls });

  return null;
}