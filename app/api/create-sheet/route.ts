import { NextRequest, NextResponse } from "next/server";
import { withUsageCheck } from "@/lib/apiAuth";
import { buildTrackerWorkbook, workbookToBuffer } from "@/lib/spreadsheet-builder";
import { hasGoogleDriveCredentials, uploadTrackerToDrive } from "@/lib/google-drive";

export const maxDuration = 60;

interface CreateSheetBody {
  idea?: string;
  niche?: string;
  productType?: string;
}

/**
 * POST /api/create-sheet
 *
 * Builds a tracker-type Google Sheets template (Dashboard, Entries,
 * Categories, Settings tabs) for the given idea and uploads it to Google
 * Drive as a native Google Sheet.
 *
 * When GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY aren't configured, returns a
 * mock response so the UI keeps working locally without Google Cloud setup.
 */
export async function POST(req: NextRequest) {
  return withUsageCheck(req, "create_sheet", async (_userId) => {
    const body = (await req.json()) as CreateSheetBody;
    const { idea, niche, productType } = body;

    if (!idea) {
      return NextResponse.json({ error: "idea is required" }, { status: 400 });
    }

    const startTime = Date.now();

    try {
      const { workbook, trackerType, fileName } = await buildTrackerWorkbook({
        productTitle: idea,
        niche,
        trackerType: productType,
      });
      const buffer = await workbookToBuffer(workbook);

      // ── Mock path — Google Drive credentials not configured yet ────────────
      if (!hasGoogleDriveCredentials()) {
        console.log({ route: "create-sheet", trackerType, success: true, mock: true });
        return NextResponse.json({
          success: true,
          mock: true,
          googleSheetUrl: null,
          fileId: null,
          trackerType,
          message:
            "Spreadsheet built successfully, but GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY aren't configured yet, so it wasn't uploaded to Drive. Add those env vars (see .env.example) to enable real Google Sheets creation.",
        });
      }

      // ── Real Drive upload ───────────────────────────────────────────────────
      const { fileId, googleSheetUrl } = await uploadTrackerToDrive({ buffer, fileName });
      const responseTime = Date.now() - startTime;

      console.log({ route: "create-sheet", trackerType, success: true, mock: false, responseTime, fileId });

      return NextResponse.json({
        success: true,
        mock: false,
        googleSheetUrl,
        fileId,
        trackerType,
        responseTime,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[create-sheet] error:", message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
