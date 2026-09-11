import type { RelPt, StrokeObject } from "@/components/home/poster/types";

function dist(a: RelPt, b: RelPt) {
  return Math.hypot(b.nx - a.nx, b.ny - a.ny);
}

function resample(points: RelPt[], spacing = 2.4): RelPt[] {
  if (points.length < 2) return points.slice();
  const out: RelPt[] = [points[0]];
  let prev = points[0];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const cur = points[i];
    let d = dist(prev, cur);
    if (d < 0.001) continue;
    while (carry + d >= spacing) {
      const t = (spacing - carry) / d;
      prev = { nx: prev.nx + (cur.nx - prev.nx) * t, ny: prev.ny + (cur.ny - prev.ny) * t };
      out.push(prev);
      d = dist(prev, cur);
      carry = 0;
    }
    carry += d;
    prev = cur;
  }
  const last = points[points.length - 1];
  if (dist(out[out.length - 1], last) > 0.5) out.push(last);
  return out;
}

function average(points: RelPt[], window = 3): RelPt[] {
  if (points.length < 3) return points.slice();
  const r = Math.max(1, Math.floor(window / 2));
  return points.map((p, i) => {
    let nx = 0;
    let ny = 0;
    let n = 0;
    for (let k = i - r; k <= i + r; k++) {
      const q = points[Math.max(0, Math.min(points.length - 1, k))];
      nx += q.nx;
      ny += q.ny;
      n += 1;
    }
    return { nx: nx / n, ny: ny / n };
  });
}

function perpendicularDistance(p: RelPt, a: RelPt, b: RelPt) {
  const dx = b.nx - a.nx;
  const dy = b.ny - a.ny;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs(dy * p.nx - dx * p.ny + b.nx * a.ny - b.ny * a.nx) / len;
}

function rdp(points: RelPt[], epsilon: number): RelPt[] {
  if (points.length < 3) return points.slice();
  let max = 0;
  let idx = 0;
  const a = points[0];
  const b = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], a, b);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max > epsilon) {
    const left = rdp(points.slice(0, idx + 1), epsilon);
    const right = rdp(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
}

/** Geometry-only stroke smooth: resample, reduce jitter, keep meaningful turns. */
export function smoothStrokePoints(points: RelPt[]): RelPt[] {
  if (points.length < 3) return points.slice();
  const even = resample(points, 2.6);
  const calm = average(even, 3);
  const kept = rdp(calm, 1.15);
  return kept.length >= 2 ? kept : calm;
}

export function smoothStroke(stroke: StrokeObject): StrokeObject {
  const original = stroke.originalPoints ?? stroke.points;
  return {
    ...stroke,
    originalPoints: original,
    points: smoothStrokePoints(original),
  };
}

export function restoreStroke(stroke: StrokeObject): StrokeObject {
  if (!stroke.originalPoints) return stroke;
  return { ...stroke, points: stroke.originalPoints };
}
