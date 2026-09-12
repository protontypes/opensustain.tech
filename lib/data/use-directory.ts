"use client";

import { useEffect, useState } from "react";

import type { DirectoryPayload } from "../types/directory";
import { directoryUrl } from "./directory-contracts";

// Single-flight cache, same rationale as use-analytics-payload.ts: several
// components on /projects could otherwise each fetch and parse the same
// ~1.5 MB file.
let inFlight: Promise<DirectoryPayload> | null = null;

function load(): Promise<DirectoryPayload> {
  if (inFlight) return inFlight;
  inFlight = fetch(directoryUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<DirectoryPayload>;
    })
    .catch((cause: unknown) => {
      inFlight = null;
      throw cause;
    });
  return inFlight;
}

export type DirectoryState = {
  data: DirectoryPayload | null;
  error: string | null;
};

export function useDirectory(): DirectoryState {
  const [state, setState] = useState<DirectoryState>({ data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ data, error: null }))
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          error: cause instanceof Error ? cause.message : "Unknown error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
