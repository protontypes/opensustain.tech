"use client";

import { useSyncExternalStore } from "react";

/**
 * The category picked on the home page, shared by the ring in the hero and the
 * category key below it, which are separate client islands. Null while every
 * category in the key is closed.
 */
let picked: string | null = null;
const listeners = new Set<() => void>();

export function setPickedCategory(name: string | null): void {
  if (name === picked) return;
  picked = name;
  for (const listener of listeners) listener();
}

export function getPickedCategory(): string | null {
  return picked;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePickedCategory(): string | null {
  return useSyncExternalStore(subscribe, getPickedCategory, () => null);
}
