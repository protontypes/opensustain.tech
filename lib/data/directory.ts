import { readFile } from "node:fs/promises";
import path from "node:path";

import type { DirectoryPayload } from "../types/directory";

export { directoryUrl } from "./directory-contracts";

/**
 * Server-side read of the full directory, for the one build-time use this
 * page has for it: the totals shown in the page header. The ~2,753-project
 * array itself is not spread into any server-rendered markup — the browsing
 * UI (components/directory/project-directory.tsx) fetches directoryUrl
 * itself client-side, the same way the analytics charts fetch their
 * payloads, rather than have Next serialize ~1.5 MB of props into the page.
 */
export async function loadDirectory(rootDir = process.cwd()): Promise<DirectoryPayload> {
  const filePath = path.join(rootDir, "public", "data", "directory.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as DirectoryPayload;
}
