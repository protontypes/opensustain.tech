import type { Rect } from "./types";

function cubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export type TweenHandle = { cancel: () => void };

/**
 * Interpolates arc rects on a single requestAnimationFrame loop.
 *
 * `onFrame` writes straight to `path.setAttribute("d", …)`; React must not
 * re-render during the tween or 2,785 elements reconcile every frame. When
 * `reduced` is set the target frame is applied once and no loop starts, which
 * is how prefers-reduced-motion is honoured.
 */
export function startTween(
  from: Rect[],
  to: Rect[],
  onFrame: (rects: Rect[], progress: number) => void,
  durationMs: number,
  reduced: boolean,
): TweenHandle {
  if (reduced || durationMs <= 0 || from.length !== to.length) {
    onFrame(to, 1);
    return { cancel: () => {} };
  }

  const scratch: Rect[] = to.map((rect) => ({ ...rect }));
  let frame = 0;
  let start = 0;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    if (frame) cancelAnimationFrame(frame);
    clearTimeout(safety);
    document.removeEventListener("visibilitychange", onVisibility);
    onFrame(to, 1);
  };

  const step = (now: number) => {
    if (done) return;
    if (start === 0) start = now;
    const progress = Math.min((now - start) / durationMs, 1);
    if (progress >= 1) {
      finish();
      return;
    }
    const eased = cubicInOut(progress);
    for (let i = 0; i < to.length; i += 1) {
      const a = from[i];
      const b = to[i];
      const target = scratch[i];
      target.x0 = a.x0 + (b.x0 - a.x0) * eased;
      target.x1 = a.x1 + (b.x1 - a.x1) * eased;
      target.y0 = a.y0 + (b.y0 - a.y0) * eased;
      target.y1 = a.y1 + (b.y1 - a.y1) * eased;
    }
    onFrame(scratch, progress);
    frame = requestAnimationFrame(step);
  };

  // Browsers pause requestAnimationFrame outright in a hidden tab. Without
  // these two nets, starting a zoom and switching away leaves the chart frozen
  // mid-flight — arcs stranded between layouts and labels held at opacity 0 —
  // and it never recovers, because the loop that would finish it never runs
  // again. setTimeout still fires when hidden, so it can close the animation out.
  const onVisibility = () => {
    if (document.visibilityState === "hidden") finish();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const safety = setTimeout(finish, durationMs + 250);

  frame = requestAnimationFrame(step);
  return {
    cancel: () => {
      if (done) return;
      done = true;
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(safety);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
