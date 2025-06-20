/**
 * @module azure-integration
 * Lightweight abstraction layer for Azure Blob Storage in Huldra.
 *
 * Environment variables:
 *   - REACT_APP_AZURE_STORAGE_ACCOUNT_NAME: Your Azure Storage account name
 *   - REACT_APP_AZURE_SAS_TOKEN: SAS token granting access permissions
 *   - REACT_APP_AZURE_CONTAINER_NAME: Name of the blob container
 *   - REACT_APP_AZURE_ROOT_DIRECTORY: Base directory inside the container (e.g. "/dev")
 *
 * Exports functions to:
 *   • list folders
 *   • list files
 *   • generate download URLs
 *   • validate asset counts per case
 *   • fetch & shuffle cases
 *   • upload blobs
 *   • fetch JSON attributes by URL
 */

import { BlobServiceClient } from "@azure/storage-blob";
import { shuffle } from "lodash";
import axios from "axios";

// Validate required environment variables
const {
  REACT_APP_AZURE_STORAGE_ACCOUNT_NAME: ACCOUNT_NAME,
  REACT_APP_AZURE_SAS_TOKEN: SAS_TOKEN,
  REACT_APP_AZURE_CONTAINER_NAME: CONTAINER_NAME,
  REACT_APP_AZURE_ROOT_DIRECTORY: ROOT_DIR = "",
} = process.env;

if (!ACCOUNT_NAME || !SAS_TOKEN || !CONTAINER_NAME) {
  throw new Error(
      "Azure integration requires REACT_APP_AZURE_STORAGE_ACCOUNT_NAME, " +
      "REACT_APP_AZURE_SAS_TOKEN, and REACT_APP_AZURE_CONTAINER_NAME"
  );
}

/**
 * Get a ContainerClient for the configured Azure Blob container.
 *
 * @returns {ContainerClient}
 */
const getContainerClient = () => {
  const url = `https://${ACCOUNT_NAME}.blob.core.windows.net?${SAS_TOKEN}`;
  return new BlobServiceClient(url).getContainerClient(CONTAINER_NAME);
};

/**
 * List subfolder names under a given path by hierarchy delimiter.
 *
 * @param {string} [path=""]  Relative path under ROOT_DIR (no leading slash).
 * @returns {Promise<string[]>}  Array of folder names.
 * @throws {Error}  On API failure.
 */
const listFoldersFromAzure = async (path = "") => {
  const prefix = `${ROOT_DIR}/${path}`.replace(/\/+/g, "/");
  const client = getContainerClient();
  const iter = client.listBlobsByHierarchy("/", { prefix });
  const folders = [];

  for await (const item of iter) {
    if (item.kind === "prefix") {
      // Extract the last segment as folder name
      const segments = item.name.split("/").filter(Boolean);
      folders.push(segments.pop());
    }
  }

  return folders;
};

/**
 * List file blob names that include a substring within a given path.
 *
 * @param {string} path             Relative path under ROOT_DIR.
 * @param {string} [substring=""]   Filter: file names must include this.
 * @returns {Promise<string[]>}     Array of blob names.
 * @throws {Error}  On API failure.
 */
const listFilesFromAzure = async (path, substring = "") => {
  const prefix = `${ROOT_DIR}/${path}`.replace(/\/+/g, "/");
  const client = getContainerClient();
  const iter = client.listBlobsFlat({ prefix });
  const files = [];

  for await (const blob of iter) {
    if (blob.name.includes(substring)) {
      files.push(blob.name);
    }
  }

  return files;
};

/**
 * Build a download URL for a blob and append metadata query params.
 *
 * @param {string|{path:string,name:string}} input
 *        Either the blob’s path string or an object with .path and .name.
 * @returns {Promise<string>}  Download URL with filename & filetype params.
 * @throws {Error}  On failure to construct URL.
 */
const getAssetDownloadUrlFromAzure = async (input) => {
  const blobPath = typeof input === "string" ? input : input.path;
  const fileName  = typeof input === "string"
      ? blobPath.split("/").pop()
      : input.name;

  const client = getContainerClient();
  const blobClient = client.getBlobClient(`${ROOT_DIR}${blobPath}`);
  const url = new URL(blobClient.url);

  // Append filename and filetype
  url.searchParams.set("filename", fileName);
  url.searchParams.set("filetype", fileName.split(".").pop());

  return url.toString();
};

/**
 * Upload a Blob or Buffer to Azure, overwriting existing blob if present.
 *
 * @param {string} path            Relative blob path under ROOT_DIR.
 * @param {Blob|Buffer} fileBlob   Data to upload.
 * @returns {Promise<void>}        Resolves on success.
 * @throws {Error}  On upload failure.
 */
const uploadFileToAzure = async (path, fileBlob) => {
  const client = getContainerClient();
  const blockClient = client.getBlockBlobClient(`${ROOT_DIR}${path}`);
  await blockClient.uploadData(fileBlob, {
    blobHTTPHeaders: { blobContentType: fileBlob.type ?? undefined }
  });
};

/**
 * Check if a folder contains the minimum number of assets for a given case type.
 *
 * @param {string} folderPath                    Path under ROOT_DIR.
 * @param {'image'|'audio'|'video'|'text'|'hybrid'} caseType
 * @returns {Promise<boolean>}
 */
const checkAssetsInAzure = async (folderPath, caseType) => {
  const assets = await listFilesFromAzure(folderPath);
  switch (caseType) {
    case "image": return assets.length >= 3;
    case "audio":
    case "video":
    case "text":  return assets.length >= 2;
    case "hybrid":return assets.length >= 3;
    default:      return false;
  }
};

/**
 * Validate an array of case folder names for required assets.
 *
 * @param {string[]} cases  Array of folder names (e.g. ["image-case1", "audio-case2"]).
 * @returns {Promise<boolean[]>}  Parallel array of validity flags.
 */
const validateCasesInAzure = async (cases) => {
  const lookup = { audio: "audio", video: "video", hybrid: "hybrid", text: "text" };
  return Promise.all(
      cases.map(async (name) => {
        const prefix = name.split("-")[0].toLowerCase();
        const type = lookup[prefix] || "image";
        return checkAssetsInAzure(`gallery/cases/${name}`, type);
      })
  );
};

/**
 * Fetch valid case names, with optional shuffling modes.
 *
 * @param {boolean} configExists  Use provided `cases` if true, else list folders.
 * @param {string} path           Base path under ROOT_DIR.
 * @param {string[]} cases        Preconfigured cases (if any).
 * @param {'full'|'categorized'|'none'} shuffleMode
 * @returns {Promise<string[]>}   Valid (and optionally shuffled) cases.
 */
const fetchCasesFromAzure = async (configExists, path, cases, shuffleMode) => {
  const candidate = configExists
      ? cases
      : await listFoldersFromAzure(path);

  const validFlags = await validateCasesInAzure(candidate);
  let valid = candidate.filter((_, i) => validFlags[i]);

  if (shuffleMode === "categorized") {
    const buckets = { image: [], audio: [], video: [], text: [], hybrid: [] };
    valid.forEach((c) => {
      const key = c.split("-")[0].toLowerCase();
      (buckets[key] || buckets.image).push(c);
    });
    return [
      ...shuffle(buckets.image),
      ...shuffle(buckets.hybrid),
      ...shuffle(buckets.video),
      ...shuffle(buckets.audio),
      ...shuffle(buckets.text),
    ];
  }
  if (shuffleMode === "full") {
    valid = shuffle(valid);
  }
  return valid;
};

/**
 * Fetch a JSON file from Azure and extract a single attribute.
 *
 * @param {string} jsonPath       Blob path under ROOT_DIR to the JSON file.
 * @param {string} attributeName  Key to extract from the fetched JSON.
 * @returns {Promise<any|null>}   Attribute value or null if error.
 */
const fetchJsonAttributeValueAzure = async (jsonPath, attributeName) => {
  try {
    const url = await getAssetDownloadUrlFromAzure(jsonPath);
    const response = await axios.get(url);
    return response.data[attributeName] ?? null;
  } catch (err) {
    console.error("Error fetching JSON attribute from Azure:", err);
    return null;
  }
};

export {
  listFoldersFromAzure,
  listFilesFromAzure,
  getAssetDownloadUrlFromAzure,
  uploadFileToAzure,
  checkAssetsInAzure,
  validateCasesInAzure,
  fetchCasesFromAzure,
  fetchJsonAttributeValueAzure,
};