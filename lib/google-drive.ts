/**
 * Google Drive upload + Sheets conversion.
 *
 * Uploads a generated .xlsx buffer to Drive and converts it into a native
 * Google Sheet in one call, by uploading the xlsx bytes with the Google
 * Sheets mimeType as the target `mimeType`.
 *
 * Two supported auth methods — pick based on your Google account type:
 *
 * 1. OAuth with your own Google account (works on ANY Gmail account,
 *    personal or Workspace). Files are created under your own Drive quota,
 *    same as if you'd uploaded them yourself.
 *      GOOGLE_OAUTH_CLIENT_ID
 *      GOOGLE_OAUTH_CLIENT_SECRET
 *      GOOGLE_OAUTH_REFRESH_TOKEN
 *    Obtain these via a one-time OAuth consent flow (e.g. OAuth Playground)
 *    for the https://www.googleapis.com/auth/drive scope.
 *
 * 2. Service account (Google Workspace only — requires a Shared Drive).
 *    Service accounts have zero personal "My Drive" storage quota, so a
 *    regular My Drive folder fails with "storage quota exceeded" the moment
 *    the service account tries to own a file there. Files created inside a
 *    Shared Drive are owned by the Shared Drive itself, sidestepping the
 *    quota limit.
 *      GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY from the service account's
 *      JSON key, sharing a Shared-Drive folder with it as Content Manager.
 *
 * GOOGLE_DRIVE_FOLDER_ID is used by both methods — either a regular My Drive
 * folder (OAuth path) or a folder inside a Shared Drive (service-account path).
 */

import { google } from "googleapis";
import { Readable } from "stream";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";

export interface UploadTrackerParams {
  buffer: Buffer;
  fileName: string;
}

export interface UploadTrackerResult {
  fileId: string;
  googleSheetUrl: string;
}

/** Service-account private keys stored in env vars usually have literal "\n" instead of real newlines. */
function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY ?? "";
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function hasOAuthCredentials(): boolean {
  return (
    !!process.env.GOOGLE_OAUTH_CLIENT_ID &&
    !!process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
}

function hasServiceAccountCredentials(): boolean {
  return !!process.env.GOOGLE_CLIENT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY;
}

export function hasGoogleDriveCredentials(): boolean {
  return hasOAuthCredentials() || hasServiceAccountCredentials();
}

function getAuthClient() {
  // Prefer OAuth (your own account) when both are configured — it works on
  // every Google account type and avoids the service-account quota problem.
  if (hasOAuthCredentials()) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
    return oauth2Client;
  }

  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: getPrivateKey(),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuthClient() });
}

/**
 * Uploads an xlsx buffer to Drive and converts it to a Google Sheet.
 * See module docblock for the two supported credential sets.
 */
export async function uploadTrackerToDrive({ buffer, fileName }: UploadTrackerParams): Promise<UploadTrackerResult> {
  if (!hasGoogleDriveCredentials()) {
    throw new Error(
      "Google Drive isn't configured. Set either GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN or GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY."
    );
  }

  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const createRes = await drive.files.create({
    requestBody: {
      name: fileName.replace(/\.xlsx$/i, ""),
      mimeType: GOOGLE_SHEET_MIME, // uploading xlsx bytes but targeting this mimeType converts it to Sheets
      ...(folderId ? { parents: [folderId] } : {}),
    },
    media: {
      mimeType: XLSX_MIME,
      body: Readable.from(buffer),
    },
    // Required whenever the target folder/parent lives inside a Shared Drive
    // (service-account path) — harmless no-op for a regular My Drive folder
    // (OAuth path), so it's always safe to include.
    supportsAllDrives: true,
    fields: "id, webViewLink",
  });

  const fileId = createRes.data.id;
  if (!fileId) throw new Error("Google Drive did not return a file id.");

  // Anyone with the link can view + make their own copy (standard pattern for
  // Etsy-style Sheets templates). Not "writer" — buyers shouldn't edit the master file.
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });
  } catch (err) {
    console.warn("[google-drive] failed to set public 'anyone with link' permission (non-fatal):", err);
  }

  const googleSheetUrl = createRes.data.webViewLink ?? `https://docs.google.com/spreadsheets/d/${fileId}/edit`;

  return { fileId, googleSheetUrl };
}
