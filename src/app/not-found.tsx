import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not found — HBW",
  description: "That page doesn't exist. Return to the index.",
};

export default function NotFound() {
  return <p className="hbw-miss">That page doesn't exist. Return to the index.</p>;
}
