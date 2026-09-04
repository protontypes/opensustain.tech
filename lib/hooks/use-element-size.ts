"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Observes a container's box so the chart can stay square and responsive.
 *
 * The ref is a callback, not an object, because every chart here renders a
 * loading state before the element exists. With an object ref and an effect on
 * `[]`, that effect ran once at mount, found `ref.current` null, and returned —
 * the observer was never created, and the size sat on its fallback for the life
 * of the page. On a phone the SVG then scaled down through `max-width: 100%`
 * while the absolutely-positioned centre overlay, sized in JS from that stale
 * width, did not: the hole overflowed the rings.
 *
 * A callback ref runs when the element actually attaches, however late that is.
 */
export function useElementSize<T extends HTMLElement>() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((element: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!element) return;

    const measure = (width: number, height: number) =>
      setSize((previous) =>
        Math.abs(previous.width - width) < 1 &&
        Math.abs(previous.height - height) < 1
          ? previous
          : { width, height },
      );

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) measure(box.width, box.height);
    });
    observer.observe(element);
    observerRef.current = observer;

    // The observer's first callback needs a rendered frame; this does not, so
    // the first paint is already at the real size.
    const box = element.getBoundingClientRect();
    if (box.width || box.height) measure(box.width, box.height);
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, ...size };
}
