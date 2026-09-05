/** Pure Studio validation helpers. Do not change frontend token meaning. */

export type EditorMovement = {
  _key?: string;
  relation?: string;
  pace?: string;
  infoHint?: string;
};

export function terminalPairMessage(movements: EditorMovement[] | undefined) {
  if (!movements?.length) return true;
  if (movements[movements.length - 1]?.relation === "pair") {
    return "The last movement cannot be Pair. Pair needs a following movement.";
  }
  return true;
}

export function uniqueMovementKeyMessage(movements: EditorMovement[] | undefined) {
  if (!movements?.length) return true;
  const keys = movements.map((movement) => movement._key).filter(Boolean);
  if (new Set(keys).size !== keys.length) return "Each movement ID must be unique within the project.";
  return true;
}

/** Editorial warning only. CLOSED pair+tight and Chris pair+normal are valid. */
export function pairPaceWarning(relation: string | undefined, pace: string | undefined) {
  if (relation === "pair" && pace === "pause") {
    return "Pair plus Pause is unusual. Pause adds space after this movement; Pair connects it to the next.";
  }
  return true;
}

export function outcomeHintWarning(
  movements: EditorMovement[] | undefined,
  hasOutcome: boolean
) {
  if (hasOutcome || !movements?.some((movement) => movement.infoHint === "outcome")) return true;
  return "A movement points at Outcome, but Outcome is empty. The site will fall back to the last written chapter.";
}

export function movementPreviewTitle(input: {
  mediaType?: string;
  scale?: string;
  pace?: string;
  relation?: string;
  mediaFit?: string;
}) {
  const media = input.mediaType === "film" ? "FILM" : "STILL";
  const scale = (input.scale || "standard").toUpperCase();
  const pace = (input.pace || "normal").toUpperCase();
  const parts = [media, scale, pace];
  if (input.relation === "pair") parts.push("PAIR");
  if (input.mediaFit === "cover") parts.push("COVER");
  return parts.join(" — ");
}
