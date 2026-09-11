/** Shared-height desktop gallery field. Width follows each movement's aspect ratio. */

export function galleryFieldHeight(
  stageWidth: number,
  stageHeight: number,
  stageGap: number,
  fullFrame: boolean
): number {
  const available = Math.max(0, stageHeight - stageGap);
  const restrained = Math.min(available, stageWidth * 0.75 * (9 / 16));
  if (!fullFrame) return Math.round(restrained);
  return Math.round(Math.min(available, stageWidth * (9 / 16)));
}

/** Keep the current movement's viewport left when the field height changes. */
export function remapGalleryX(input: {
  savedX: number;
  oldLeft: number;
  newLeft: number;
}): number {
  return input.savedX + (input.newLeft - input.oldLeft);
}
