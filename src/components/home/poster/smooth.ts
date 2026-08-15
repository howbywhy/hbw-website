import type { Pt, StrokeObject } from "@/components/home/poster/types";

function dist(a: Pt, b: Pt) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function resample(points: Pt[], spacing = 2.4): Pt[] {
  if (points.length < 2) return points.slice();
  const out: Pt[] = [points[0]];
  let prev = points[0];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const cur = points[i];
    let d = dist(prev, cur);
    if (d < 0.001) continue;
    while (carry + d >= spacing) {
      const t = (spacing - carry) / d;
      prev = { x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t };
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

function average(points: Pt[], window = 3): Pt[] {
  if (points.length < 3) return points.slice();
  const r = Math.max(1, Math.floor(window / 2));
  return points.map((p, i) => {
    let x = 0;
    let y = 0;
    let n = 0;
    for (let k = i - r; k <= i + r; k++) {
      const q = points[Math.max(0, Math.min(points.length - 1, k))];
      x += q.x;
      y += q.y;
      n += 1;
    }
    return { x: x / n, y: y / n };
  });
}

function perpendicularDistance(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

function rdp(points: Pt[], epsilon: number): Pt[] {
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
export function smoothStrokePoints(points: Pt[]): Pt[] {
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
