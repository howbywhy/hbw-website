import type { ProjectMedia } from "../../components/home/projects/types";
import type { AdapterMediaConfig, SanityFileAsset, SanityFileValue, SanityImageAsset, SanityImageValue } from "./types";
import { AdapterError } from "./types";

function variantsFor(width: number) {
  if (width > 1920) return [500, 800, 1080, 1600];
  if (width > 1080) return [500, 800, 1080];
  if (width > 800) return [500, 800];
  return [500];
}

function srcSetForLocal(src: string, widths: number[], intrinsic: number) {
  const ext = src.endsWith(".webp") ? "webp" : src.endsWith(".png") ? "png" : "jpg";
  if (ext !== "jpg" && ext !== "webp") return undefined;
  const base = src.replace(/\.(jpg|webp)$/, "");
  return widths.map((w) => `${base}-p-${w}.${ext} ${w}w`).concat(`${src} ${intrinsic}w`).join(", ");
}

function isLocalPath(url: string) {
  return url.startsWith("/");
}

export function parseImageAssetId(id: string) {
  const match = id.match(/^image-([a-f0-9]+)-(\d+)x(\d+)-([a-z0-9]+)$/i);
  if (!match) return null;
  return { hash: match[1], width: Number(match[2]), height: Number(match[3]), ext: match[4] };
}

export function parseFileAssetId(id: string) {
  const match = id.match(/^file-([a-f0-9]+)-([a-z0-9]+)$/i);
  if (!match) return null;
  return { hash: match[1], ext: match[2] };
}

function resolveAssetId(asset: { _id?: string; _ref?: string } | undefined) {
  return asset?._id || asset?._ref;
}

export function imageAssetUrl(asset: SanityImageAsset | { _ref: string }, config: AdapterMediaConfig) {
  if ("url" in asset && asset.url) return asset.url;
  const id = resolveAssetId(asset);
  if (!id) throw new AdapterError("MISSING_MEDIA", "Image asset is missing an id");
  const parsed = parseImageAssetId(id);
  if (!parsed) throw new AdapterError("MISSING_MEDIA", `Unrecognised image asset id: ${id}`);
  return `https://cdn.sanity.io/images/${config.projectId}/${config.dataset}/${parsed.hash}-${parsed.width}x${parsed.height}.${parsed.ext}`;
}

export function fileAssetUrl(asset: SanityFileAsset | { _ref: string }, config: AdapterMediaConfig) {
  if ("url" in asset && asset.url) return asset.url;
  const id = resolveAssetId(asset);
  if (!id) throw new AdapterError("MISSING_MEDIA", "File asset is missing an id");
  const parsed = parseFileAssetId(id);
  if (!parsed) throw new AdapterError("MISSING_MEDIA", `Unrecognised file asset id: ${id}`);
  return `https://cdn.sanity.io/files/${config.projectId}/${config.dataset}/${parsed.hash}.${parsed.ext}`;
}

export function imageDimensions(value: SanityImageValue | undefined) {
  const asset = value?.asset;
  if (!asset) return null;
  if ("metadata" in asset && asset.metadata?.dimensions) {
    return { width: asset.metadata.dimensions.width, height: asset.metadata.dimensions.height };
  }
  const parsed = parseImageAssetId(resolveAssetId(asset) || "");
  if (parsed) return { width: parsed.width, height: parsed.height };
  return null;
}

export function stillToProjectMedia(
  value: SanityImageValue | undefined,
  alt: string,
  config: AdapterMediaConfig,
  variants?: number[]
): ProjectMedia {
  if (!value?.asset) throw new AdapterError("MISSING_MEDIA", "Still movement is missing an image");
  const url = imageAssetUrl(value.asset, config);
  const dims = imageDimensions(value);
  if (!dims) throw new AdapterError("MISSING_MEDIA", "Still image is missing dimensions");
  const widths = (variants ?? variantsFor(dims.width)).filter((w) => w < dims.width);
  const srcSet = isLocalPath(url)
    ? widths.length === 0
      ? undefined
      : srcSetForLocal(url, widths, dims.width)
    : widths.length === 0
      ? undefined
      : [...widths.map((w) => `${url}?w=${w} ${w}w`), `${url} ${dims.width}w`].join(", ");
  return {
    type: "image",
    src: url,
    srcSet,
    width: dims.width,
    height: dims.height,
    alt,
    fit: "contain",
  };
}

export function filmToProjectMedia(
  video: SanityFileValue | undefined,
  poster: SanityImageValue | undefined,
  webm: SanityFileValue | undefined,
  alt: string,
  config: AdapterMediaConfig
): ProjectMedia {
  if (!video?.asset) throw new AdapterError("MISSING_MEDIA", "Film movement is missing an MP4");
  if (!poster?.asset) throw new AdapterError("MISSING_MEDIA", "Film movement is missing a poster");
  const src = fileAssetUrl(video.asset, config);
  const posterUrl = imageAssetUrl(poster.asset, config);
  const videoDims =
    "metadata" in video.asset && video.asset.metadata?.dimensions
      ? { width: video.asset.metadata.dimensions.width, height: video.asset.metadata.dimensions.height }
      : null;
  const dims = videoDims ?? imageDimensions(poster);
  if (!dims) throw new AdapterError("MISSING_MEDIA", "Film is missing dimensions");
  return {
    type: "video",
    src,
    mp4: src,
    videoSrc: src,
    webm: webm?.asset ? fileAssetUrl(webm.asset, config) : undefined,
    width: dims.width,
    height: dims.height,
    poster: posterUrl,
    alt,
    fit: "contain",
    autoplay: true,
    loop: true,
    muted: true,
  };
}

export function previewToRecordMedia(value: SanityImageValue | undefined, config: AdapterMediaConfig, variants?: number[]) {
  const media = stillToProjectMedia(value, "", config, variants);
  return {
    src: media.src,
    srcSet: media.srcSet ?? `${media.src} ${media.width}w`,
    width: media.width,
    height: media.height,
  };
}
