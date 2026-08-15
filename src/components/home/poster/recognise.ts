import type { StrokeObject } from "@/components/home/poster/types";

export type RecogniseResult = {
  text: string;
  confidence?: number;
};

export type RecogniseProvider = {
  recognise(strokes: StrokeObject[]): Promise<RecogniseResult>;
};

const FLAG = "NEXT_PUBLIC_HBW_RECOGNISE";

export function recogniseEnabled() {
  return process.env.NEXT_PUBLIC_HBW_RECOGNISE === "1";
}

/** Scaffold only. No OCR package is wired; do not treat this as production recognition. */
export async function recogniseStrokes(_strokes: StrokeObject[]): Promise<RecogniseResult> {
  void _strokes;
  void FLAG;
  throw new Error("Handwriting recognition is not configured.");
}
