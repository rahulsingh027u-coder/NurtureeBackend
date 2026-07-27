import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const MAINTENANCE_FILE = join(process.cwd(), ".maintenance.json");

interface MaintenanceState {
  enabled: boolean;
  message: string;
  updatedBy: string;
  updatedAt: string;
}

function readState(): MaintenanceState {
  const defaults: MaintenanceState = {
    enabled: false,
    message: "We are performing scheduled maintenance. We will be back shortly.",
    updatedBy: "system",
    updatedAt: new Date().toISOString(),
  };
  if (!existsSync(MAINTENANCE_FILE)) {
    writeFileSync(MAINTENANCE_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  try {
    return JSON.parse(readFileSync(MAINTENANCE_FILE, "utf-8"));
  } catch {
    return defaults;
  }
}

function writeState(state: MaintenanceState) {
  writeFileSync(MAINTENANCE_FILE, JSON.stringify(state, null, 2));
}

// GET /api/maintenance — public
export async function GET() {
  const state = readState();
  return NextResponse.json(state);
}

// PUT /api/maintenance — toggle maintenance
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { enabled, message, updatedBy } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled (boolean) is required" },
        { status: 400 }
      );
    }

    const current = readState();
    const newState: MaintenanceState = {
      enabled,
      message: message || current.message,
      updatedBy: updatedBy || "admin",
      updatedAt: new Date().toISOString(),
    };

    writeState(newState);
    return NextResponse.json(newState);
  } catch (error) {
    console.error("Maintenance PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance mode" },
      { status: 500 }
    );
  }
}
