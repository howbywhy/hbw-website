import assert from "node:assert/strict";
import { test } from "node:test";
import { isCmsPreviewAllowed } from "./allowed";

function withVercelEnv(value: string | undefined, fn: () => void) {
  const previous = process.env.VERCEL_ENV;
  if (value === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = value;
  try {
    fn();
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
}

test("production Vercel blocks CMS preview", () => {
  withVercelEnv("production", () => {
    assert.equal(isCmsPreviewAllowed(), false);
  });
});

test("Vercel preview deployments allow CMS preview", () => {
  withVercelEnv("preview", () => {
    assert.equal(isCmsPreviewAllowed(), true);
  });
});

test("without Vercel production, preview follows NODE_ENV", () => {
  withVercelEnv(undefined, () => {
    assert.equal(isCmsPreviewAllowed(), process.env.NODE_ENV !== "production");
  });
});
