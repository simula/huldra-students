// src/hooks/usePerformanceMetrics.js
import { useEffect, useState, useRef } from "react";
import { CASE_DIRS, SIZE_MAP, humanFileSize, humanMemoryDelta, lookupGeo } from "../utils/perfHelpers";
import { surveyRoutes } from "../routes";

/**
 * usePerformanceMetrics
 * React hook to capture fetch and memory metrics for survey assets,
 * and trigger a CSV download at the end of the survey.
 *
 * @param {Object} params
 * @param {string} params.currentRoute - current window route
 * @param {string} params.providerName - name of the storage provider
 * @param {(caseDir: string) => Promise<string[]>} params.buildUrls - async fn that returns URLs for a given caseDir
 */
export function usePerformanceMetrics({ currentRoute, providerName, buildUrls }) {
  const [allMetrics, setAllMetrics] = useState([]);
  const [location, setLocation] = useState({ country: "Unknown", continent: "Unknown" });
  const recorded = useRef(new Set());
  const hasDownloaded = useRef(false);

  // Get geolocation once
  useEffect(() => {
    lookupGeo().then(setLocation).catch(() => {});
  }, []);

  // Clear resource timings on route change
  useEffect(() => {
    performance.clearResourceTimings();
  }, [currentRoute]);

  // Capture metrics when hitting a survey step
  useEffect(() => {
    const matched = surveyRoutes.find((r) => currentRoute.endsWith(r));
    if (!matched) return;

    const capture = async (routeKey) => {
      const idx = parseInt(routeKey.replace(/.*case/, ""), 10) - 1;
      const caseDir = CASE_DIRS[idx];
      if (!caseDir) return;

      const urls = await buildUrls(caseDir);
      const ITER = 7;
      const newMetrics = [];
      const { country, continent } = location;

      for (const url of urls) {
        if (recorded.current.has(url)) continue;
        recorded.current.add(url);

        let sumFetch = 0;
        let count = 0;
        let headerSize = 0;
        for (let i = 0; i < ITER; i++) {
          performance.clearResourceTimings();
          const t0 = performance.now();
          let resp;
          try {
            resp = await fetch(url, { cache: "no-store" });
          } catch {
            continue;
          }
          const t1 = performance.now();

          if (i === 0) {
            const headersText = [...resp.headers.entries()]
              .map(([k, v]) => `${k}: ${v}`)
              .join("\r\n");
            headerSize = new TextEncoder().encode(headersText).length;
          } else {
            sumFetch += t1 - t0;
            count++;
          }
        }

        const avgFetch = count > 0 ? sumFetch / count : 0;
        if (window.gc) window.gc();
        const memBefore = performance.memory?.usedJSHeapSize || 0;
        let blobSize = 0;
        try {
          const blobResp = await fetch(url, { cache: "no-store" });
          const blob = await blobResp.blob();
          blobSize = blob.size;
        } catch {
        }
        const memAfter = performance.memory?.usedJSHeapSize || 0;

        const memDelta = Math.max(memAfter - memBefore, 0);
        const payloadKB = blobSize / 1024;
        const throughputKBps = avgFetch > 0 ? (payloadKB * 1000) / avgFetch : 0;

        newMetrics.push({
          route: routeKey,
          storageProvider: providerName,
          country,
          continent,
          fileURL: url,
          fileName: url.split("/").pop(),
          fileType: url.split(".").pop().toUpperCase(),
          size: SIZE_MAP[url.split("/").pop()] || "unknown",
          fileSize: humanFileSize(blobSize),
          fetchTimeMs: avgFetch.toFixed(2),
          throughputKBps: throughputKBps.toFixed(2),
          payloadKB: payloadKB.toFixed(2),
          headerSizeBytes: headerSize,
          memoryDelta: humanMemoryDelta(memDelta),
        });
      }

      setAllMetrics((prev) => [...prev, ...newMetrics]);
    };

    capture(matched);
  }, [currentRoute, location, providerName, buildUrls]);

  // Download CSV when survey ends
  useEffect(() => {
    if (
      currentRoute.endsWith("/survey/end") &&
      allMetrics.length > 0 &&
      !hasDownloaded.current
    ) {
      const headerKeys = Object.keys(allMetrics[0]);
      const header = headerKeys.join(",") + "\n";
      const rows = allMetrics
        .map((m) => headerKeys.map((k) => m[k]).join(","))
        .join("\n");
      const blob = new Blob([header + rows], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${providerName}_complete_metrics.csv`;
      a.click();
      hasDownloaded.current = true;
    }
  }, [currentRoute, allMetrics, providerName]);
}