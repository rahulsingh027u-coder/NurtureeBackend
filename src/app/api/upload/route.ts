import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// P0-2: Document upload endpoint.
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf",
]);
const UPLOAD_DIR = path.join(process.cwd(), "private_uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string | null;
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided. Use field name 'file'." }, { status: 400 });
    if (!documentType) return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    if (!entityType || !["doctor", "caregiver"].includes(entityType)) return NextResponse.json({ error: "entityType must be 'doctor' or 'caregiver'" }, { status: 400 });
    if (!entityId) return NextResponse.json({ error: "entityId is required" }, { status: 400 });

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not allowed. Accepted: JPEG, PNG, WebP, GIF, PDF.` }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE / 1024 / 1024} MB.` }, { status: 400 });
    }

    const entityDir = path.join(UPLOAD_DIR, entityType, entityId);
    await mkdir(entityDir, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const randomSuffix = crypto.randomBytes(6).toString("hex");
    const filename = `${documentType}-${Date.now()}-${randomSuffix}.${ext}`;
    const filepath = path.join(entityDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    const url = `/uploads/${entityType}/${entityId}/${filename}`;

    return NextResponse.json({
      success: true, url, documentType, filename, size: file.size, mimeType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
