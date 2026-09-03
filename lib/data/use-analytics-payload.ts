"use client";

import { useEffect, useState } from "react";

import { analyticsPayloadUrl, type AnalyticsPayloadKey } from "./contracts";

/**
 * One in-flight request per payload, shared by every component that asks.
 *
 * The organizations page has five charts over `organizations-overview.json`.
 * Fetching per component would hit the HTTP cache but still parse 527 KB of
 * JSON five times and hold five copies. The module-level promise means one
 * fetch, one parse, one object.
 */
const inFlight = new Map<AnalyticsPayloadKey, Promise<unknown>>();

function load<T>(key: AnalyticsPayloadKey): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const request = fetch(analyticsPayloadUrl(key))
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<T>;
    })
    .catch((cause: unknown) => {
      // Do not cache a failure — a retry (or a second component mounting)
      // should be able to try again.
      inFlight.delete(key);
      throw cause;
    });

  inFlight.set(key, request);
  return request;
}

export type PayloadState<T> = { data: T | null; error: string | null };

export function useAnalyticsPayload<T>(key: AnalyticsPayloadKey): PayloadState<T> {
  const [state, setState] = useState<PayloadState<T>>({
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    load<T>(key)
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
  }, [key]);

  return state;
}
