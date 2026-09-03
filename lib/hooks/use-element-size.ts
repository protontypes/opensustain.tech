"use client";

import { useEffect, useRef, useState } from "react";

/** Observes a container's box so the chart can stay square and responsive. */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentRect;
      setSize((previous) =>
        Math.abs(previous.width - box.width) < 1 &&
        Math.abs(previous.height - box.height) < 1
          ? previous
          : { width: box.width, height: box.height },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}
