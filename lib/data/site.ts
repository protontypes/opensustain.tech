import { readFile } from "node:fs/promises";
import path from "node:path";

import type { EducationPayload, SiteTotals } from "../types/site";

async function readData<T>(file: string, rootDir: string): Promise<T> {
  const raw = await readFile(path.join(rootDir, "public", "data", file), "utf-8");
  return JSON.parse(raw) as T;
}

/**
 * The counts every page shows. Read these rather than a payload's own totals,
 * so no two pages can describe the ecosystem with different numbers.
 */
export function loadSiteTotals(rootDir = process.cwd()): Promise<SiteTotals> {
  return readData<SiteTotals>("site-totals.json", rootDir);
}

/** education.md as a list. Small enough to render on the server whole. */
export function loadEducation(rootDir = process.cwd()): Promise<EducationPayload> {
  return readData<EducationPayload>("education.json", rootDir);
}
