/**
 * @module onedrive-integration
 * Minimal abstraction layer for OneDrive operations in Huldra.
 *
 * Environment variables:
 *   - REACT_APP_ONEDRIVE_ACCESS_TOKEN: OAuth2 access token for Microsoft Graph
 *   - REACT_APP_ONEDRIVE_ROOT_DIRECTORY: Base folder path in OneDrive (e.g. "dev")
 *
 * Exports functions to:
 *   • getOneDriveClient
 *   • listFoldersFromOneDrive
 *   • listFilesFromOneDrive
 *   • getAssetDownloadUrlFromOneDrive
 *   • checkAssetsInOneDrive
 *   • validateCasesInOneDrive
 *   • fetchCasesFromOneDrive
 *   • uploadFileToOneDrive
 */
import axios from "axios";
import { shuffle as _shuffle } from "lodash";

// Validate required environment variables
const {
  REACT_APP_ONEDRIVE_ACCESS_TOKEN,
  REACT_APP_ONEDRIVE_ROOT_DIRECTORY = ""
} = process.env;

if (!REACT_APP_ONEDRIVE_ACCESS_TOKEN) {
  throw new Error(
      "Missing OneDrive credentials: ensure REACT_APP_ONEDRIVE_ACCESS_TOKEN is set"
  );
}

/**
 * Create an authorized Axios client for OneDrive Graph API.
 * @returns {Promise<import('axios').AxiosInstance>} Axios instance
 */
async function getOneDriveClient() {
  return axios.create({
    baseURL: "https://graph.microsoft.com/v1.0/me/drive/",
    headers: {
      Authorization: `Bearer ${REACT_APP_ONEDRIVE_ACCESS_TOKEN}`
    }
  });
}

/**
 * List sub-folder names under a given OneDrive path.
 * @param {string} [path=""] Relative path under root directory.
 * @returns {Promise<string[]>} Array of folder names
 * @throws {Error} On API failure
 */
async function listFoldersFromOneDrive(path = "") {
  const client = await getOneDriveClient();
  const url = `/root:/${REACT_APP_ONEDRIVE_ROOT_DIRECTORY}/${path}:/children`;
  const response = await client.get(url);
  return response.data.value
      .filter(item => item.folder)
      .map(folder => folder.name);
}

/**
 * List file names under a given OneDrive path, optionally filtered by substring.
 * @param {string} path Relative path under root directory
 * @param {string} [substring=""] Substring to filter file names
 * @returns {Promise<string[]>} Array of file names
 * @throws {Error} On API failure
 */
async function listFilesFromOneDrive(path, substring = "") {
  const client = await getOneDriveClient();
  const url = `/root:/${REACT_APP_ONEDRIVE_ROOT_DIRECTORY}/${path}:/children`;
  const response = await client.get(url);
  return response.data.value
      .filter(item => item.file && item.name.includes(substring))
      .map(file => file.name);
}

/**
 * Get a direct download URL for a file in OneDrive.
 * @param {string} path Relative path under root to the file (including leading slash)
 * @returns {Promise<string>} Direct download URL
 * @throws {Error} On API failure
 */
async function getAssetDownloadUrlFromOneDrive(path) {
  const client = await getOneDriveClient();
  const url = `/root:/${REACT_APP_ONEDRIVE_ROOT_DIRECTORY}${path}:/content`;
  const response = await client.get(url);
  return response.request.responseURL;
}

/**
 * Check if a folder contains the minimum assets for a case type.
 * @param {string} folderPath Relative path under root
 * @param {'image'|'audio'|'video'|'text'|'hybrid'} caseType
 * @returns {Promise<boolean>} True if meets requirement
 */
async function checkAssetsInOneDrive(folderPath, caseType) {
  const assets = await listFilesFromOneDrive(folderPath);
  switch (caseType) {
    case 'image': return assets.length >= 3;
    case 'audio':
    case 'video':
    case 'text':  return assets.length >= 2;
    case 'hybrid':return assets.length >= 3;
    default:      return false;
  }
}

/**
 * Validate an array of case folder names by asset requirements.
 * @param {string[]} cases Array of case folder names
 * @returns {Promise<boolean[]>} Parallel array of validity flags
 */
async function validateCasesInOneDrive(cases) {
  const lookup = { audio:'audio', video:'video', hybrid:'hybrid', text:'text' };
  return Promise.all(
      cases.map(async caseName => {
        const type = lookup[caseName.split('-')[0].toLowerCase()] || 'image';
        return checkAssetsInOneDrive(`/gallery/cases/${caseName}`, type);
      })
  );
}

/**
 * Fetch valid case names, optionally shuffling the result.
 * @param {boolean} usePreconfig If true, uses provided cases array
 * @param {string} path Folder path under root for cases
 * @param {string[]} cases Array of preconfigured case names
 * @param {boolean} shuffle If true, shuffle the valid names
 * @returns {Promise<string[]>} Array of valid case names
 */
async function fetchCasesFromOneDrive(usePreconfig, path, cases, shuffle = false) {
  const names = usePreconfig
      ? cases
      : await listFoldersFromOneDrive(path);
  const flags = await validateCasesInOneDrive(names);
  let valid = names.filter((_, i) => flags[i]);
  if (shuffle) valid = _shuffle(valid);
  return valid;
}

/**
 * Upload or replace a file in OneDrive.
 * Uses ETag to conditional overwrite when possible.
 * @param {string} path Relative path under root (including leading slash)
 * @param {Blob|Buffer} fileContent File data
 * @param {string} fileName Desired file name
 * @returns {Promise<object>} OneDrive file metadata
 * @throws {Error} On upload failure
 */
async function uploadFileToOneDrive(path, fileContent, fileName) {
  const client = await getOneDriveClient();
  const fullPath = `/root:/${REACT_APP_ONEDRIVE_ROOT_DIRECTORY}${path}`;
  let eTag;
  try {
    const info = await client.get(`${fullPath}`);
    eTag = info.headers['etag'];
  } catch (err) {
    if (!(err.response && err.response.status === 404)) throw err;
  }
  const headers = { 'Content-Type':'application/octet-stream' };
  if (eTag) headers['If-Match'] = eTag;
  const response = await client.put(`${fullPath}:/content`, fileContent, { headers });
  return response.data;
}

export {
  listFoldersFromOneDrive,
  listFilesFromOneDrive,
  getAssetDownloadUrlFromOneDrive,
  checkAssetsInOneDrive,
  validateCasesInOneDrive,
  fetchCasesFromOneDrive,
  uploadFileToOneDrive
};