import React, { useMemo } from "react";
import config from "./config.json";
import { SIZE_MAP } from "./perfHelpers";
import { usePerformanceMetrics } from "./hooks/usePerformanceMetrics";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "./firebase";

/**
 * PerformanceMetricsFirebase
 * Thin wrapper that provides Firebase Storage URL builder to the shared metrics hook.
 * Assumes `storage` is your initialized Firebase Storage instance.
 */
export default function PerformanceMetricsFirebase({ currentRoute }) {
  // Extract provider name (e.g., "firebase") from config
  const providerName = useMemo(
    () => config.REACT_APP_general.storage.assetsStorageType,
    []
  );

  // URL builder: uses Firebase getDownloadURL for each file
  const buildUrls = useMemo(() => {
    return async (caseDir) => {
      const prefix = `${caseDir}-`;
      const files = Object.keys(SIZE_MAP).filter((fn) => fn.startsWith(prefix));
      // Map each filename to its Firebase Storage URL
      const urls = await Promise.all(
        files.map((fileName) =>
          getDownloadURL(
            ref(storage, `gallery/cases/${caseDir}/${fileName}`)
          )
        )
      );
      return urls;
    };
  }, []);

  // Delegate performance metric collection to the shared hook
  usePerformanceMetrics({ currentRoute, providerName, buildUrls });

  return null;
}