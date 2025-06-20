import React, { useMemo } from "react";
import config from "./config.json";
import { SIZE_MAP } from "./perfHelpers";
import { usePerformanceMetrics } from "./hooks/usePerformanceMetrics";
import { getAssetDownloadUrlFromGoogleDrive } from "./utils/googledrive";

/**
 * PerformanceMetricsGoogleDrive
 * Thin wrapper providing Google Drive URL builder to the shared metrics hook.
 */
export default function PerformanceMetricsGoogleDrive({ currentRoute }) {
  // Memoize provider name and file links map from config
  const providerName = useMemo(
    () => config.REACT_APP_general.storage.assetsStorageType,
    []
  );
  const driveLinks = useMemo(
    () => config.REACT_APP_general.storage.googleDriveLinks || {},
    []
  );

  // URL builder: use explicit link if provided, otherwise resolve via helper
  const buildUrls = useMemo(() => {
    return async (caseDir) => {
      const prefix = `${caseDir}-`;
      const files = Object.keys(SIZE_MAP).filter((fileName) =>
        fileName.startsWith(prefix)
      );
      const urls = await Promise.all(
        files.map(async (fileName) => {
          if (driveLinks[fileName]) {
            return driveLinks[fileName];
          }
          // fallback: dynamically resolve from Google Drive
          const path = `gallery/cases/${caseDir}/${fileName}`;
          return await getAssetDownloadUrlFromGoogleDrive(path);
        })
      );
      return urls;
    };
  }, [driveLinks]);

  // Delegate metrics capture to shared hook
  usePerformanceMetrics({ currentRoute, providerName, buildUrls });

  return null;
}