/**
 * @module google-drive-integration
 * Minimal abstraction layer for Google Drive operations in Huldra.
 *
 * Environment variables:
 *   - REACT_APP_GOOGLE_DRIVE_CLIENT_ID: OAuth2 client ID for Drive API
 *   - REACT_APP_GOOGLE_DRIVE_API_KEY: API key for Drive REST calls
 *   - REACT_APP_GOOGLE_DRIVE_FOLDER_ID: Root folder ID for asset retrieval
 *   - REACT_APP_GOOGLE_DRIVE_RESPONSE_FOLDER_ID: Folder ID for uploading responses
 *
 * Exports functions to:
 *   • initializeGoogleDrive
 *   • listFilesFromGoogleDrive
 *   • checkAssetsInGoogleDrive
 *   • validateCasesInGoogleDrive
 *   • fetchCasesFromGoogleDrive
 *   • uploadFileToGoogleDrive
 *   • getAssetDownloadUrlFromGoogleDrive
 *   • fetchJsonAttributeValueFromGoogleDrive
 */
import {gapi} from "gapi-script";
import axios from "axios";
import {shuffle as _shuffle} from "lodash";

// Track single-response file state
let cachedFileId = null;
let fileCreated = false;
let isCreatingFile = false;

const SCOPES = "https://www.googleapis.com/auth/drive";
const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];

const {
    REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
    REACT_APP_GOOGLE_DRIVE_API_KEY,
    REACT_APP_GOOGLE_DRIVE_FOLDER_ID,
    REACT_APP_GOOGLE_DRIVE_RESPONSE_FOLDER_ID,
} = process.env;

if (!REACT_APP_GOOGLE_DRIVE_CLIENT_ID || !REACT_APP_GOOGLE_DRIVE_API_KEY) {
    throw new Error(
        "Missing Google Drive credentials: ensure CLIENT_ID and API_KEY are set"
    );
}

let gapiInitialized = false;

/**
 * Initialize the Google API client and sign in the user.
 * @returns {Promise<void>}
 * @throws {Error} If initialization or sign-in fails.
 */
async function initializeGoogleDrive() {
    if (gapiInitialized) return;
    await new Promise((resolve, reject) => {
        gapi.load("client:auth2", () => {
            gapi.client
                .init({
                    apiKey: REACT_APP_GOOGLE_DRIVE_API_KEY,
                    clientId: REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                })
                .then(() => gapi.auth2.getAuthInstance().signIn())
                .then(() => {
                    gapiInitialized = true;
                    resolve();
                })
                .catch(err => reject(new Error(`gapi init/sign-in failed: ${err.message}`)));
        });
    });
}

/**
 * Retrieve the current OAuth2 access token.
 * @returns {string}
 */
function getAccessToken() {
    return gapi.auth2.getAuthInstance().currentUser
        .get()
        .getAuthResponse().access_token;
}

/**
 * Resolve a slash-delimited folder path to a Google Drive folder ID.
 * @param {string} pathString Path segments separated by '/'.
 * @returns {Promise<string>} The ID of the final folder in the path.
 * @throws {Error} If any folder in the path is not found.
 */
async function getTargetFolderId(pathString) {
    await initializeGoogleDrive();
    let folderId = REACT_APP_GOOGLE_DRIVE_FOLDER_ID;
    for (const part of pathString.split("/").filter(Boolean)) {
        const res = await gapi.client.drive.files.list({
            q: `'\${folderId}' in parents and name = '\${part}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: "files(id)",
        });
        if (!res.result.files.length) throw new Error(`Folder '\${part}' not found`);
        folderId = res.result.files[0].id;
    }
    return folderId;
}

/**
 * List file names in a Google Drive folder specified by path.
 * @param {string} folderPath Slash-delimited path under the root folder.
 * @param {string} [substring=""] Optional substring filter for file names.
 * @returns {Promise<string[]>} Array of file names matching the filter.
 */
async function listFilesFromGoogleDrive(folderPath, substring = "") {
    const folderId = await getTargetFolderId(folderPath);
    return listFilesInFolder(folderId, substring);
}

/**
 * List file names in a Google Drive folder specified by folder ID.
 * @param {string} folderId The Drive folder ID.
 * @param {string} [substring=""] Optional substring filter.
 * @returns {Promise<string[]>} Array of file names.
 */
async function listFilesInFolder(folderId, substring = "") {
    await initializeGoogleDrive();
    const res = await gapi.client.drive.files.list({
        q: `'\${folderId}' in parents and name contains '\${substring}' and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id,name)",
    });
    return res.result.files.map(f => f.name);
}

/**
 * Check if a folder contains enough assets for a case type.
 * @param {string} folderPath
 * @param {'image'|'audio'|'video'|'text'|'hybrid'} caseType
 * @returns {Promise<boolean>}
 */
async function checkAssetsInGoogleDrive(folderPath, caseType) {
    const files = await listFilesFromGoogleDrive(folderPath);
    switch (caseType) {
        case "image":
            return files.length >= 3;
        case "audio":
        case "video":
        case "text":
            return files.length >= 2;
        case "hybrid":
            return files.length >= 3;
        default:
            return false;
    }
}

/**
 * Validate an array of case folder names.
 * @param {string[]} cases
 * @returns {Promise<boolean[]>}
 */
async function validateCasesInGoogleDrive(cases) {
    const map = {audio: "audio", video: "video", hybrid: "hybrid", text: "text"};
    return Promise.all(
        cases.map(name => {
            const prefix = name.split("-")[0].toLowerCase();
            return checkAssetsInGoogleDrive(`/gallery/cases/${name}`, map[prefix] || "image");
        })
    );
}

/**
 * Fetch valid case names from Drive and optionally shuffle.
 * @param {boolean} usePreconfig If true, use provided `cases`, else list folder contents.
 * @param {string} path Slash-delimited path under root for case folders.
 * @param {string[]} cases Array of preconfigured case names.
 * @param {boolean} shuffle If true, return a shuffled array.
 * @returns {Promise<string[]>} Array of valid case names.
 */
async function fetchCasesFromGoogleDrive(usePreconfig, path, cases, shuffle = false) {
    const names = usePreconfig ? cases : await listFilesFromGoogleDrive(path);
    const flags = await validateCasesInGoogleDrive(names);
    let valid = names.filter((_, i) => flags[i]);
    if (shuffle) valid = _shuffle(valid);
    return valid;
}

/**
 * Upload or update a file in Google Drive using multipart upload.
 * @param {string} fileName The file's name.
 * @param {Blob|string|ArrayBuffer} content The file content.
 * @param {string} mimeType The MIME type of the content.
 * @returns {Promise<Object>} Metadata of the uploaded file.
 */
async function uploadFileToGoogleDrive(fileName, content, mimeType) {
    await initializeGoogleDrive();
    const token = getAccessToken();
    const parent = REACT_APP_GOOGLE_DRIVE_RESPONSE_FOLDER_ID;
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify({
        name: fileName,
        parents: [parent]
    })], {type: "application/json"}));
    form.append("file", new Blob([content], {type: mimeType || "application/octet-stream"}));
    const method = isCreatingFile ? "POST" : "PATCH";
    const url = cachedFileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${cachedFileId}?uploadType=multipart`
        : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    if (!cachedFileId) isCreatingFile = true;
    const res = await fetch(url, {method, headers: {Authorization: `Bearer ${token}`}, body: form});
    if (!res.ok) throw new Error(`${method} failed: ${res.status}`);
    const data = await res.json();
    if (!cachedFileId) cachedFileId = data.id;
    fileCreated = true;
    return data;
}

/**
 * Generate a download URL for a file in Drive, choosing link type based on MIME.
 * @param {string} fullPath Slash-delimited path under root to the file.
 * @returns {Promise<string>} Download URL with filename and filetype parameters.
 */
async function getAssetDownloadUrlFromGoogleDrive(fullPath) {
    await initializeGoogleDrive();
    const seg = fullPath.split("/").filter(Boolean);
    const name = seg.pop();
    const folderId = await getTargetFolderId(seg.join("/"));
    const res = await gapi.client.drive.files.list({
        q: `'\${folderId}' in parents and name = '\${name}' and trashed=false`,
        fields: "files(id,name,mimeType,thumbnailLink,webViewLink)",
    });
    if (!res.result.files.length) throw new Error(`File '${name}' not found`);
    const file = res.result.files[0];
    let url = file.webViewLink;
    if (file.mimeType.startsWith("image/")) url = file.thumbnailLink;
    else if (/^(audio|video)\//.test(file.mimeType)) url = `https://drive.google.com/file/d/${file.id}/preview`;
    else if (file.mimeType.startsWith("text/")) url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${REACT_APP_GOOGLE_DRIVE_API_KEY}`;
    const u = new URL(url);
    u.searchParams.set("filename", file.name);
    u.searchParams.set("filetype", file.name.split(".").pop());
    return u.toString();
}

/**
 * Fetch a JSON file from Drive and return a specific attribute.
 * @param {string} jsonPath Slash-delimited path under root to JSON file.
 * @param {string} attr Name of the JSON attribute to extract.
 * @returns {Promise<any|null>} The attribute value or null on error.
 */
async function fetchJsonAttributeValueFromGoogleDrive(jsonPath, attr) {
    try {
        const url = await getAssetDownloadUrlFromGoogleDrive(jsonPath);
        const resp = await axios.get(url);
        return resp.data[attr] ?? null;
    } catch {
        return null;
    }
}

export {
    initializeGoogleDrive,
    listFilesFromGoogleDrive,
    checkAssetsInGoogleDrive,
    validateCasesInGoogleDrive,
    fetchCasesFromGoogleDrive,
    uploadFileToGoogleDrive,
    getAssetDownloadUrlFromGoogleDrive,
    fetchJsonAttributeValueFromGoogleDrive,
};