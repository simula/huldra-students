/**
 * @module dropbox-integration
 * Streamlined Dropbox SDK integration for use within Huldra.
 *
 * Environment variables:
 *   - REACT_APP_DROPBOX_ACCESS_TOKEN: OAuth2 token for Dropbox API
 *   - REACT_APP_DROPBOX_ROOT_DIRECTORY: Base folder path (e.g. "/dev")
 *
 * Exports functions to:
 *   • list folders
 *   • list files
 *   • generate temporary download URLs
 *   • validate asset counts per case
 *   • upload survey response blobs
 */

import { Dropbox } from "dropbox";
import { shuffle } from "lodash";

// Validate required environment variables
const ACCESS_TOKEN = process.env.REACT_APP_DROPBOX_ACCESS_TOKEN;
const ROOT_DIR = process.env.REACT_APP_DROPBOX_ROOT_DIRECTORY || "";

if (!ACCESS_TOKEN) {
  throw new Error("Missing REACT_APP_DROPBOX_ACCESS_TOKEN environment variable");
}

// Initialize Dropbox client
const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });

/**
 * Recursively list all entries (files and folders) in a Dropbox directory.
 * Handles pagination by following cursors until all entries are retrieved.
 *
 * @param {string} [path=""]  Relative path under the root directory.
 * @returns {Promise<Object[]>}  Array of raw Dropbox entry objects.
 * @throws {Error}  If any Dropbox API call fails.
 */
const listAllEntries = async (path = "") => {
  const fullPath = `${ROOT_DIR}${path}`;
  let entries = [];
  let response = await dbx.filesListFolder({ path: fullPath });

  entries.push(...response.result.entries);

  // Continue fetching if there are more entries
  while (response.result.has_more) {
    response = await dbx.filesListFolderContinue({ cursor: response.result.cursor });
    entries.push(...response.result.entries);
  }

  return entries;
};

/**
 * List all sub-folder names under a given Dropbox directory.
 *
 * @param {string} [path=""]  Relative path under the root directory.
 * @returns {Promise<string[]>}  Array of folder names.
 * @throws {Error}  If the Dropbox API call fails.
 */
const listFolders = async (path = "") => {
  const entries = await listAllEntries(path);
  return entries
      .filter(entry => entry[".tag"] === "folder")
      .map(folder => folder.name);
};

/**
 * List all files whose names include a specified substring within a Dropbox directory.
 *
 * @param {string} path             Relative path under the root directory.
 * @param {string} [substring=""]   Substring to filter file names.
 * @returns {Promise<Array<{ path: string, name: string }>>}
 *          Array of objects with file path and original name.
 * @throws {Error}  If the Dropbox API call fails.
 */
const listFiles = async (path, substring = "") => {
  const entries = await listAllEntries(path);
  return entries
      .filter(entry =>
          entry[".tag"] === "file" &&
          entry.name.includes(substring)
      )
      .map(file => ({
        path: file.path_lower,
        name: file.name
      }));
};

/**
 * Generate a temporary download URL for a Dropbox file, appending filename and filetype.
 *
 * @param {string|{ path: string, name: string }} input
 *        Either a string path or an object with `.path` and `.name`.
 * @returns {Promise<string>}  The temporary download URL.
 * @throws {Error}  If the Dropbox API call fails.
 */
const getAssetDownloadUrlFromDropbox = async (input) => {
  // Determine filePath and fileName based on input type
  let filePath = typeof input === "string"
      ? input
      : input.path;
  let fileName = typeof input === "string"
      ? filePath.split("/").pop()
      : input.name;

  const fullPath = `${ROOT_DIR}${filePath}`;
  const response = await dbx.filesGetTemporaryLink({ path: fullPath });
  const tempLink = response.result.link;
  const url = new URL(tempLink);

  // Append filename and filetype as query parameters
  url.searchParams.set("filename", fileName);
  const fileType = fileName.split(".").pop();
  url.searchParams.set("filetype", fileType);

  return url.toString();
};

/**
 * Check that a folder contains the minimum number of assets required for a case type.
 *
 * @param {string} folderPath  Path under root where assets are stored.
 * @param {'image'|'audio'|'video'|'text'|'hybrid'} caseType
 *        Case type determining required asset count.
 * @returns {Promise<boolean>}  True if the folder meets the asset count requirement.
 */
const checkAssets = async (folderPath, caseType) => {
  const assets = await listFiles(folderPath, "");
  switch (caseType) {
    case "image":
      return assets.length >= 3;
    case "audio":
    case "video":
    case "text":
      return assets.length >= 2;
    case "hybrid":
      return assets.length >= 3;
    default:
      return false;
  }
};

/**
 * Validate multiple case names by checking their asset requirements.
 *
 * @param {string[]} cases  Array of case folder names (e.g. ["image-case1", "audio-case2"]).
 * @returns {Promise<boolean[]>}  Array of booleans indicating validity per case.
 */
const validateCases = async (cases) => {
  // Map folder prefix to caseType
  const lookup = { audio: "audio", video: "video", hybrid: "hybrid", text: "text" };

  return Promise.all(
      cases.map(async (caseName) => {
        const prefix = caseName.split("-")[0].toLowerCase();
        const caseType = lookup[prefix] || "image";
        return checkAssets(`/gallery/cases/${caseName}`, caseType);
      })
  );
};

/**
 * Fetch and optionally shuffle valid case names.
 *
 * @param {boolean} hasPreconfiguredCases
 *        If true, uses provided `cases` array; otherwise reads folder names at `path`.
 * @param {string} path        Base path under root (e.g. "/gallery/cases").
 * @param {string[]} cases     Array of case names when `hasPreconfiguredCases` is true.
 * @param {'full'|'none'} shuffleMode
 *        'full' for complete randomization, 'none' to preserve order.
 * @returns {Promise<string[]>}  Array of validated (and possibly shuffled) case names.
 */
const fetchCases = async (hasPreconfiguredCases, path, cases, shuffleMode) => {
  let candidateCases = hasPreconfiguredCases
      ? cases
      : await listFolders(path);

  // Filter out invalid cases
  const validity = await validateCases(candidateCases);
  let validCases = candidateCases.filter((_, idx) => validity[idx]);

  // Shuffle if requested
  if (shuffleMode === "full") {
    validCases = shuffle(validCases);
  }

  return validCases;
};

/**
 * Upload a Blob (e.g. JSON response) to Dropbox, overwriting if it exists.
 *
 * @param {string} path       Relative path under root where the file should be saved.
 * @param {Blob|Buffer} data  File data to upload.
 * @returns {Promise<Object>}  Dropbox response result (includes path_lower, id, etc.).
 * @throws {Error}  If the Dropbox API call fails.
 */
const uploadFileToDropbox = async (path, data) => {
  const fullPath = `${ROOT_DIR}${path}`;
  const response = await dbx.filesUpload({
    path: fullPath,
    contents: data,
    mode: { ".tag": "overwrite" },
    mute: true
  });
  return response.result;
};

export {
  listAllEntries,
  listFolders,
  listFiles,
  getAssetDownloadUrlFromDropbox,
  checkAssets,
  validateCases,
  fetchCases,
  uploadFileToDropbox,
};