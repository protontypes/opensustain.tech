/**
 * Public URL of the project directory payload.
 *
 * Split out from directory.ts (which pulls in `node:fs`/`node:path` for its
 * server-side loader) the same way lib/data/contracts.ts is split from
 * loaders.ts, so a client component importing just the URL doesn't pull
 * Node built-ins into the browser bundle.
 */
export const directoryUrl = "/data/directory.json";
