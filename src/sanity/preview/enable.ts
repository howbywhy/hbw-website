import { previewPathFromRedirect } from "./paths";

export type PreviewUrlValidation = {
  isValid: boolean;
  redirectTo?: string;
};

export type AuthorizeDraftPreviewResult =
  | { ok: true; location: string }
  | { ok: false; status: 401 | 404 | 503; message: string };

export function authorizeDraftPreview(
  validation: PreviewUrlValidation,
  configured: boolean
): AuthorizeDraftPreviewResult {
  if (!configured) {
    return { ok: false, status: 503, message: "Draft preview is not configured." };
  }
  if (!validation.isValid) {
    return { ok: false, status: 401, message: "Invalid preview secret." };
  }
  const location = previewPathFromRedirect(validation.redirectTo);
  if (!location) {
    return { ok: false, status: 404, message: "Unknown preview project." };
  }
  return { ok: true, location };
}
