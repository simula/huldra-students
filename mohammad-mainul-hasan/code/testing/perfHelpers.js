// src/utils/perfHelpers.js
/**
 * Utility functions and constants for performance metric tests.
 */

// Case directories in survey order
export const CASE_DIRS = [
  "video-test1",
  "video-test2",
  "audio-test1",
  "audio-test2",
  "text-sample",
  "image-test",
];

// All test filenames
export const ALL_FILES = [
  "video-test1-a.mp4",
  "video-test1-b.mp4",
  "video-test2-a.mp4",
  "audio-test1-a.mp3",
  "audio-test1-b.mp3",
  "audio-test2-a.mp3",
  "image-test-a.jpg",
  "image-test-b.jpg",
  "text-sample-a.txt",
];

// Map single-letter keys to size labels
const SIZE_LABEL_MAP = { a: "small", b: "medium", c: "large" };

// Dynamically generate SIZE_MAP from ALL_FILES
export const SIZE_MAP = ALL_FILES.reduce((map, fileName) => {
  const key = fileName.split("-")[1].charAt(0);
  map[fileName] = SIZE_LABEL_MAP[key] || "unknown";
  return map;
}, {});

// Formats bytes into KB/MB
export function humanFileSize(bytes = 0) {
  const n = Number(bytes);
  if (isNaN(n) || n < 0) return "0 KB";
  return n >= 1e6
    ? `${(n / 1e6).toFixed(2)} MB`
    : `${(n / 1024).toFixed(2)} KB`;
}

// Formats byte delta into MB
export function humanMemoryDelta(bytes = 0) {
  const n = Number(bytes);
  if (isNaN(n)) return "0 MB";
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

// Continent code → name map
export const CONTINENT_MAP = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
};

// Geo-lookup cache
let _geoCache;
/**
 * Fetch country & continent by IP (only once).
 * Falls back to Unknown on error.
 */
export async function lookupGeo() {
  if (_geoCache) return _geoCache;
  try {
    const data = await fetch("https://ipapi.co/json/").then((r) => r.json());
    _geoCache = {
      country: data.country_name || "Unknown",
      continent: CONTINENT_MAP[data.continent_code] || "Unknown",
    };
  } catch {
    _geoCache = { country: "Unknown", continent: "Unknown" };
  }
  return _geoCache;
}