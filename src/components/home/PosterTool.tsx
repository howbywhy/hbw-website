"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowUUpLeft,
  Circle,
  IconContext,
  LineSegment,
  Pencil,
  Rectangle,
  Star,
  TextT,
  Trash,
  PaperPlaneTilt,
  Triangle,
  UploadSimple,
} from "@phosphor-icons/react";
import {
  canvasToSendDataUrl,
  fileToImageObjectSource,
  imageMimeFromFile,
  isPosterImageMime,
} from "@/components/home/poster/image";
import {
  hit,
  measureTextBlock,
  nearHandle,
  paint,
  uid,
  type Handle,
} from "@/components/home/poster/paint";
import {
  HANDLE_SLOP_MOUSE,
  HANDLE_SLOP_TOUCH,
  cornerCursor,
  isCornerHandle,
  marqueeHits,
  moveObject,
  nearHandleBox,
  nearLineEnd,
  nearSideHandle,
  normalizeLegacyObject,
  objectBox,
  relPoints,
  rectFromPoints,
  reflowTextBox,
  scaleObject,
  scaleObjects,
  unionBox,
  viewLine,
  viewText,
  writeBox,
  writeLine,
  type DragHandle,
  type SideHandle,
} from "@/components/home/poster/geometry";
import { promoteLegacyPoster } from "@/components/home/poster/migrate";
import {
  BOX_SHAPES,
  FIELD_COLOR,
  PALETTE,
  type BoxShapeKind,
  type BoxShapeObject,
  type Field,
  type ImageObject,
  type LineShapeObject,
  type PosterObj,
  type Pt,
  type StrokeObject,
  type TextObject,
  isBoxShape,
  isLineShape,
} from "@/components/home/poster/types";
import {
  hydrateWorkspace,
  persistWorkspace,
  releaseSchema2Poster,
  resetPoster,
  workspace,
} from "@/components/home/workspace";

type Making = "rest" | "write" | "draw" | "upload";
type PlaceKind = "image" | "line" | "arrow" | BoxShapeKind | null;
type Tray = "none" | "draw" | "shape" | "poster";

function isBoxPlace(kind: PlaceKind): kind is BoxShapeKind {
  return Boolean(kind && BOX_SHAPES.includes(kind as BoxShapeKind));
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function commitPoster(partial: Partial<typeof workspace.poster>) {
  Object.assign(workspace.poster, partial);
  persistWorkspace();
}

type Props = {
  dormant?: boolean;
  hidden?: boolean;
};

/** Memoised: the shell re-renders as the work line reports what's in view; the canvas must not. */
export const PosterTool = memo(function PosterTool({ dormant = false, hidden = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const objectsRef = useRef<PosterObj[]>([]);
  const draftRef = useRef<PosterObj | null>(null);
  const dragRef = useRef<{
    ids: string[];
    last: Pt;
    start: Pt;
    resize: DragHandle | null;
    mayEdit: boolean;
    snapped?: boolean;
    pan?: { cx: number; cy: number };
  } | null>(null);
  const marqueeRef = useRef<{ start: Pt; current: Pt } | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  const undoRef = useRef<PosterObj[][]>([]);
  const editingIdRef = useRef<string | null>(null);
  const skipIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const suppressBlurRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const colorRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const pendingImageRef = useRef<{ src: string; mime: string; w: number; h: number } | null>(null);
  const lastPtrRef = useRef<Pt | null>(null);
  const [dropping, setDropping] = useState(false);
  // Opens with the pencil already in hand. "rest" armed nothing, so the first
  // thing a visitor did on a poster was work out which button to press.
  const [making, setMaking] = useState<Making>("draw");
  const [placeKind, setPlaceKind] = useState<PlaceKind>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#e23b2e");
  const [decision, setDecision] = useState("");
  const [email, setEmail] = useState("");
  const [frozen, setFrozen] = useState(false);
  const colorLiveRef = useRef(color);
  const backgroundLiveRef = useRef(FIELD_COLOR);
  const decisionLiveRef = useRef(decision);
  const frozenLiveRef = useRef(frozen);
  colorLiveRef.current = color;
  decisionLiveRef.current = decision;
  frozenLiveRef.current = frozen;
  const [resetAsk, setResetAsk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [reposition, setReposition] = useState(false);
  const [tray, setTray] = useState<Tray>("none");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [background, setBackground] = useState(FIELD_COLOR);
  backgroundLiveRef.current = background;
  const [shapePaint, setShapePaint] = useState<"fill" | "outline">("fill");
  const [hasWork, setHasWork] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [, setObjectRev] = useState(0);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  editingIdRef.current = editingId;
  skipIdRef.current = editingId;
  selectedIdsRef.current = selectedIds;

  function commitSelection(ids: string[]) {
    selectedIdsRef.current = ids;
    setSelectedIds(ids);
  }

  function field(): Field {
    return { w: Math.max(1, sizeRef.current.w), h: Math.max(1, sizeRef.current.h) };
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const wrap = wrapRef.current;
    const marquee = marqueeRef.current;
    paint(ctx, objectsRef.current, draftRef.current, wrap?.clientWidth ?? 0, wrap?.clientHeight ?? 0, {
      selectedIds: frozen || reviewing || sending || making !== "rest" ? [] : selectedIds,
      chrome: !frozen && !reviewing && !sending && !editingIdRef.current && making === "rest",
      skipId: skipIdRef.current,
      reposition,
      marquee: marquee ? rectFromPoints(marquee.start, marquee.current) : null,
      background,
    });
  }, [background, frozen, making, reviewing, reposition, selectedIds, sending]);

  function tryPromote(w: number, h: number) {
    if (workspace.poster.schema !== 2) return;
    const next = promoteLegacyPoster(workspace.poster, { w, h });
    if (next) {
      workspace.poster = next;
      objectsRef.current = next.objects;
      releaseSchema2Poster();
      persistWorkspace();
      setHasWork(next.objects.length > 0 || next.frozen);
      setHasContent(hasComposition());
      setFrozen(next.frozen);
      return;
    }
    const fallback = (workspace.poster.legacyPixelObjects || [])
      .map((obj) => normalizeLegacyObject(obj, { w, h }))
      .filter((obj): obj is PosterObj => Boolean(obj));
    if (fallback.length) objectsRef.current = workspace.poster.objects.concat(fallback);
  }

  const resize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const keyboard =
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hbw-vv-inset")) > 0;
    if ((editingIdRef.current || keyboard) && sizeRef.current.w === w && sizeRef.current.h !== h) return;
    sizeRef.current = { w, h };
    if (w > 8 && h > 8) tryPromote(w, h);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
    const note = noteRef.current;
    const bar = wrap?.querySelector<HTMLElement>(".hbw-poster-toolbar");
    if (note && bar) {
      const fr = wrap.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      // The toolbar slides in and out (e.g. on Back it re-enters from 18px lower). Measure
      // where it rests, not where it is mid-slide, or the note lands on top of it.
      //
      // Only the vertical slide is subtracted. The horizontal transform is
      // translateX(-50%), which is how the toolbar is centred — it is part of
      // where it rests, not a slide, and taking it out puts the note 246px to
      // the right.
      const slide = new DOMMatrixReadOnly(getComputedStyle(bar).transform === "none" ? undefined : getComputedStyle(bar).transform).m42;
      note.style.left = `${Math.max(0, br.left - fr.left)}px`;
      note.style.bottom = "auto";
      note.style.top = `${Math.max(0, br.top - slide - fr.top - note.offsetHeight - 10)}px`;
    }
  }, [redraw]);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      hydrateWorkspace();
      objectsRef.current = workspace.poster.objects.filter((o) => o.id !== "decision");
      setColor(workspace.poster.color);
      setBackground(workspace.poster.background || FIELD_COLOR);
      setDecision(workspace.poster.decision);
      setFrozen(workspace.poster.frozen);
      if (workspace.poster.frozen) setEmailStatus("Sent. We’ll be in touch.");
      // Pencil in hand, same as a fresh poster. A sent poster is read-only, so
      // arming a tool there would only light a button that cannot be used.
      setMaking(workspace.poster.frozen ? "rest" : "draw");
      setPlaceKind(null);
      setHasWork(objectsRef.current.length > 0 || workspace.poster.frozen || Boolean(workspace.poster.legacyPixelObjects?.length));
      setHasContent(hasComposition() || Boolean(workspace.poster.legacyPixelObjects?.length));
    }
    resize();
    window.addEventListener("resize", resize);
    /*
     * The note is placed from wherever the toolbar is at the moment it is
     * measured. Coming home from a project the toolbar is still sliding, so
     * the note kept the mid-flight position — 50px right of the toolbar, for
     * the rest of the session. Place it again once the slide finishes.
     */
    const settle = (event: Event) => {
      if ((event.target as HTMLElement | null)?.classList?.contains("hbw-poster-toolbar")) resize();
    };
    const wrapEl = wrapRef.current;
    wrapEl?.addEventListener("transitionend", settle);
    const vv = window.visualViewport;
    let frame = 0;
    let last = -1;
    const applyInset = () => {
      if (!vv) return;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const next = inset > 48 ? Math.round(inset) : 0;
      if (next === last) return;
      last = next;
      document.documentElement.style.setProperty("--hbw-vv-inset", `${next}px`);
    };
    const onViewport = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyInset();
      });
    };
    vv?.addEventListener("resize", onViewport);
    vv?.addEventListener("scroll", onViewport);
    applyInset();
    return () => {
      window.removeEventListener("resize", resize);
      wrapEl?.removeEventListener("transitionend", settle);
      vv?.removeEventListener("resize", onViewport);
      vv?.removeEventListener("scroll", onViewport);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.setProperty("--hbw-vv-inset", "0px");
    };
  }, [resize]);

  useEffect(() => {
    if (!hidden) resize();
  }, [hidden, resize]);

  useEffect(() => {
    if (!editingId) return;
    const node = editRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
  }, [editingId]);

  useEffect(() => {
    redraw();
    if (!reviewing || frozen || sending) return;
    const canvas = canvasRef.current;
    if (canvas) setPreviewUrl(canvasToSendDataUrl(canvas));
  }, [redraw, reviewing, frozen, sending]);

  function snapshot() {
    undoRef.current = undoRef.current.concat([objectsRef.current.map((o) => structuredClone(o))]).slice(-40);
  }

  function snapshotOnce(drag: { snapped?: boolean }) {
    if (drag.snapped) return;
    snapshot();
    drag.snapped = true;
  }

  function remember() {
    commitPoster({
      objects: objectsRef.current,
      decision: decisionLiveRef.current,
      color: colorLiveRef.current,
      background: backgroundLiveRef.current,
      frozen: frozenLiveRef.current,
      font: "Visual",
    });
    setHasWork(objectsRef.current.length > 0 || undoRef.current.length > 0 || frozen);
    setHasContent(hasComposition() || Boolean(draftRef.current));
    setObjectRev((n) => n + 1);
  }

  function pos(event: { clientX: number; clientY: number }): Pt {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }

  function selected(): PosterObj | undefined {
    if (selectedIds.length !== 1) return undefined;
    return objectsRef.current.find((o) => o.id === selectedIds[0]);
  }

  function selectedObjects() {
    const ids = new Set(selectedIds);
    return objectsRef.current.filter((o) => ids.has(o.id));
  }

  function restWithSelection(id: string | null) {
    restWithSelectionIds(id ? [id] : []);
  }

  function restWithSelectionIds(ids: string[]) {
    if (editingIdRef.current) commitEdit();
    setMaking("rest");
    setPlaceKind(null);
    setTray("none");
    setPaletteOpen(false);
    setReposition(false);
    setGhost(null);
    pendingImageRef.current = null;
    commitSelection(ids);
  }

  function toRest() {
    if (editingIdRef.current) commitEdit();
    restWithSelection(null);
    setEditingId(null);
    draftRef.current = null;
  }

  function startEdit(obj: TextObject) {
    suppressBlurRef.current = true;
    editingIdRef.current = obj.id;
    skipIdRef.current = obj.id;
    const f = field();
    const viewed = viewText(obj, f);
    const h = measureTextBlock({ size: viewed.size, font: obj.font, w: viewed.w, text: obj.text }).h;
    if (Math.abs(h - viewed.h) > 1) {
      objectsRef.current = objectsRef.current.map((o) => {
        if (o.id !== obj.id || o.kind !== "text") return o;
        const next = { ...o };
        writeBox(next, { x: viewed.x, y: viewed.y, w: viewed.w, h }, f, viewed.size);
        return next;
      });
    }
    setDraftText(obj.text);
    setEditingId(obj.id);
    commitSelection([obj.id]);
    setMaking("write");
    setReposition(false);
    setPaletteOpen(false);
  }

  function applyDraft(text: string) {
    const id = editingIdRef.current;
    setDraftText(text);
    if (!id) return;
    const f = field();
    objectsRef.current = objectsRef.current.map((o) => {
      if (o.id !== id || o.kind !== "text") return o;
      const viewed = viewText(o, f);
      const next = { ...o, text };
      const h = measureTextBlock({ size: viewed.size, font: o.font, w: viewed.w, text }).h;
      writeBox(next, { x: viewed.x, y: viewed.y, w: viewed.w, h }, f, viewed.size);
      return next;
    });
    redraw();
  }

  function commitEdit() {
    const id = editingIdRef.current;
    if (!id) return;
    const obj = objectsRef.current.find((o) => o.id === id);
    if (obj?.kind === "text" && !obj.text.trim()) {
      objectsRef.current = objectsRef.current.filter((o) => o.id !== id);
      commitSelection([]);
    }
    editingIdRef.current = null;
    skipIdRef.current = null;
    setEditingId(null);
    setMaking("rest");
    remember();
    redraw();
  }

  useEffect(() => {
    if (!editingId) return;
    const id = window.setTimeout(() => {
      suppressBlurRef.current = false;
      const node = editRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      const len = node.value.length;
      try {
        node.setSelectionRange(len, len);
      } catch {
        /* some mobile browsers */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [editingId]);

  function startWriteAt(p: Pt) {
    snapshot();
    const f = field();
    const size = Math.max(28, Math.min(120, f.h * 0.14));
    const w = Math.min(f.w * 0.55, Math.max(200, size * 3.4));
    const h = Math.max(size * 1.25, 48);
    const obj: TextObject = {
      id: uid(),
      kind: "text",
      nx: 0,
      ny: 0,
      nw: w / f.w,
      ratio: w / h,
      sizeRatio: size / h,
      text: "",
      color,
      font: "Visual",
      align: "left",
    };
    writeBox(obj, { x: p.x - 12, y: p.y - size * 0.45, w, h }, f, size);
    objectsRef.current = objectsRef.current.concat(obj);
    startEdit(obj);
    redraw();
  }

  async function ingestImageFile(file: File) {
    if (!isPosterImageMime(imageMimeFromFile(file))) return null;
    try {
      return await fileToImageObjectSource(file);
    } catch {
      return null;
    }
  }

  async function addImageFile(file: File) {
    const source = await ingestImageFile(file);
    if (!source) return;
    pendingImageRef.current = source;
    setPlaceKind("image");
    setMaking("upload");
    setTray("none");
    commitSelection([]);
    setReposition(false);
  }

  async function dropImageFile(file: File, p: Pt) {
    const source = await ingestImageFile(file);
    if (!source) return;
    pendingImageRef.current = source;
    placeImageAt(p);
  }

  function placeImageAt(p: Pt) {
    const source = pendingImageRef.current;
    if (!source) return;
    snapshot();
    const f = field();
    const maxW = Math.min(320, f.w * 0.4);
    const ratio = source.w / Math.max(1, source.h);
    const w = maxW;
    const h = maxW / ratio;
    const obj: ImageObject = {
      id: uid(),
      kind: "image",
      nx: 0,
      ny: 0,
      nw: w / f.w,
      ratio,
      cx: 50,
      cy: 40,
      src: source.src,
      mime: source.mime,
    };
    writeBox(obj, { x: p.x - w / 2, y: p.y - h / 2, w, h }, f);
    objectsRef.current = objectsRef.current.concat(obj);
    pendingImageRef.current = null;
    setGhost(null);
    restWithSelection(obj.id);
    remember();
    redraw();
  }

  function handleSlop(pointerType: string) {
    return pointerType === "touch" ? HANDLE_SLOP_TOUCH : HANDLE_SLOP_MOUSE;
  }

  function setCanvasCursor(value: string) {
    const canvas = canvasRef.current;
    if (canvas) canvas.style.setProperty("cursor", value, "important");
  }

  function hoverCursor(p: Pt, pointerType: string) {
    if (making === "write") return "text";
    if (making === "draw" || making === "upload") return "crosshair";
    const f = field();
    const slop = handleSlop(pointerType);
    const liveIds = selectedIdsRef.current;
    if (making === "rest" && liveIds.length) {
      const group = unionBox(objectsRef.current.filter((o) => liveIds.includes(o.id)), f);
      const corner = group ? nearHandleBox(group, p, slop) : null;
      if (corner) return cornerCursor(corner);
      if (liveIds.length === 1) {
        const only = objectsRef.current.find((o) => o.id === liveIds[0]);
        if (only?.kind === "text" && nearSideHandle(objectBox(only, f), p, slop)) return "ew-resize";
        if (only && isLineShape(only) && nearLineEnd(only, p, f, slop)) return "crosshair";
      }
    }
    const found = [...objectsRef.current].reverse().find((o) => hit(o, p, f));
    if (found) {
      if (reposition && found.kind === "image" && liveIds.length === 1 && liveIds[0] === found.id) return "move";
      return "grab";
    }
    if (hasComposition()) return "crosshair";
    return "text";
  }

  function beginDrag(ids: string[], p: Pt, event: React.PointerEvent, handle: DragHandle | null, mayEdit: boolean, snapped = false) {
    const only = ids.length === 1 ? objectsRef.current.find((o) => o.id === ids[0]) : undefined;
    dragRef.current = {
      ids,
      last: p,
      start: p,
      resize: handle,
      mayEdit,
      snapped,
      pan: reposition && only?.kind === "image" ? { cx: only.cx, cy: only.cy } : undefined,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* optional */
    }
  }

  function selectObject(found: PosterObj, p: Pt, event: React.PointerEvent) {
    const shift = event.shiftKey && event.pointerType !== "touch";
    const currentIds = selectedIdsRef.current;
    const alreadyGroup = currentIds.includes(found.id);
    const nextIds = shift
      ? alreadyGroup
        ? currentIds.filter((id) => id !== found.id)
        : currentIds.concat(found.id)
      : [found.id];
    commitSelection(nextIds);
    setMaking("rest");
    setPlaceKind(null);
    setTray("none");
    setPaletteOpen(false);
    if (found.kind !== "image" || nextIds.length !== 1) setReposition(false);
    const f = field();
    const slop = handleSlop(event.pointerType);
    const group = nextIds.length > 1 ? unionBox(objectsRef.current.filter((o) => nextIds.includes(o.id)), f) : null;
    let handle: DragHandle | null = group ? nearHandleBox(group, p, slop) : nearHandle(found, p, f, slop);
    if (!handle && nextIds.length === 1 && found.kind === "text") {
      handle = nearSideHandle(objectBox(found, f), p, slop);
    }
    if (!handle && nextIds.length === 1 && isLineShape(found)) {
      handle = nearLineEnd(found, p, f, slop);
    }
    setTray("none");
    if (shift && !nextIds.includes(found.id)) {
      dragRef.current = null;
      return;
    }
    beginDrag(
      nextIds,
      p,
      event,
      handle,
      !shift && found.kind === "text" && alreadyGroup && nextIds.length === 1 && event.pointerType !== "touch" && !handle
    );
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (frozen || dormant || reviewing || sending) return;
    if (making === "draw" && !placeKind) event.preventDefault();
    const p = pos(event);
    lastPtrRef.current = p;
    const f = field();
    const found = [...objectsRef.current].reverse().find((o) => hit(o, p, f));
    const wasEditing = editingIdRef.current;

    if (wasEditing) {
      const wasId = wasEditing;
      commitEdit();
      if (found?.kind === "text" && found.id !== wasId) {
        startEdit(found);
        return;
      }
      if (found && found.kind !== "text") {
        selectObject(found, p, event);
        return;
      }
      restWithSelection(null);
      return;
    }

    if (making === "write") {
      startWriteAt(p);
      return;
    }

    if (making === "draw" && !placeKind) {
      snapshot();
      const stroke: StrokeObject = {
        id: uid(),
        kind: "stroke",
        points: relPoints([p], f),
        color,
        width: 1.8,
      };
      draftRef.current = stroke;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* optional */
      }
      return;
    }

    if (placeKind === "image") {
      placeImageAt(p);
      return;
    }

    if (isBoxPlace(placeKind)) {
      snapshot();
      const obj: BoxShapeObject = {
        id: uid(),
        kind: "shape",
        shape: placeKind,
        nx: 0,
        ny: 0,
        nw: 0.02,
        ratio: 1,
        color,
        fill: true,
        outline: false,
        weight: 1.5,
      };
      writeBox(obj, { x: p.x, y: p.y, w: 8, h: 8 }, f);
      draftRef.current = obj;
      beginDrag([obj.id], p, event, "se", false, true);
      setGhost(null);
      return;
    }

    if (placeKind === "line" || placeKind === "arrow") {
      snapshot();
      const obj: LineShapeObject = {
        id: uid(),
        kind: "shape",
        shape: placeKind,
        nx1: p.x / f.w,
        ny1: p.y / f.h,
        nx2: p.x / f.w,
        ny2: p.y / f.h,
        color,
        weight: 2,
      };
      draftRef.current = obj;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* optional */
      }
      setGhost(null);
      return;
    }

    const slop = handleSlop(event.pointerType);
    const liveIds = selectedIdsRef.current;
    if (making === "rest" && liveIds.length) {
      const group = unionBox(objectsRef.current.filter((o) => liveIds.includes(o.id)), f);
      const handle = group ? nearHandleBox(group, p, slop) : null;
      if (handle) {
        beginDrag(liveIds, p, event, handle, false);
        return;
      }
      if (liveIds.length === 1) {
        const only = objectsRef.current.find((o) => o.id === liveIds[0]);
        if (only?.kind === "text") {
          const side = nearSideHandle(objectBox(only, f), p, slop);
          if (side) {
            beginDrag(liveIds, p, event, side, false);
            return;
          }
        }
        if (only && isLineShape(only)) {
          const end = nearLineEnd(only, p, f, slop);
          if (end) {
            beginDrag(liveIds, p, event, end, false);
            return;
          }
        }
      }
    }

    if (found) {
      selectObject(found, p, event);
      return;
    }

    if (!hasComposition()) {
      startWriteAt(p);
      return;
    }

    if (event.pointerType !== "touch") {
      restWithSelectionIds([]);
      marqueeRef.current = { start: p, current: p };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* optional */
      }
      redraw();
      return;
    }

    toRest();
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (frozen || dormant || reviewing || sending) return;
    const p = pos(event);
    lastPtrRef.current = p;
    const f = field();
    if (marqueeRef.current) {
      marqueeRef.current.current = p;
      setCanvasCursor("crosshair");
      redraw();
      return;
    }
    if ((placeKind === "image" || isBoxPlace(placeKind)) && !draftRef.current && !dragRef.current) {
      setGhost({ x: p.x, y: p.y });
    }
    if (dragRef.current && !draftRef.current) {
      const drag = dragRef.current;
      const current = objectsRef.current.find((o) => o.id === drag.ids[0]);
      if (!current && !drag.ids.length) return;
      if (drag.pan && current?.kind === "image" && drag.ids.length === 1) {
        setCanvasCursor("move");
        objectsRef.current = objectsRef.current.map((o) =>
          o.id === current.id && o.kind === "image"
            ? {
                ...o,
                cx: Math.max(0, Math.min(100, drag.pan!.cx + (p.x - drag.start.x) / 3)),
                cy: Math.max(0, Math.min(100, drag.pan!.cy + (p.y - drag.start.y) / 3)),
              }
            : o
        );
      } else if (drag.resize === "e" || drag.resize === "w") {
        snapshotOnce(drag);
        setCanvasCursor("ew-resize");
        if (current?.kind === "text" && drag.ids.length === 1) {
          objectsRef.current = objectsRef.current.map((o) =>
            o.id === current.id && o.kind === "text"
              ? reflowTextBox(o, drag.resize as SideHandle, p, f, (w, size) =>
                  measureTextBlock({ size, font: current.font, w, text: current.text }).h
                )
              : o
          );
        }
      } else if (drag.resize === "a" || drag.resize === "b") {
        snapshotOnce(drag);
        setCanvasCursor("crosshair");
        if (current && isLineShape(current) && drag.ids.length === 1) {
          const line = viewLine(current, f);
          objectsRef.current = objectsRef.current.map((o) => {
            if (o.id !== current.id || !isLineShape(o)) return o;
            const next = structuredClone(o);
            if (drag.resize === "a") writeLine(next, { x1: p.x, y1: p.y, x2: line.x2, y2: line.y2 }, f);
            else writeLine(next, { x1: line.x1, y1: line.y1, x2: p.x, y2: p.y }, f);
            return next;
          });
        }
      } else if (drag.resize && isCornerHandle(drag.resize)) {
        snapshotOnce(drag);
        setCanvasCursor(cornerCursor(drag.resize));
        objectsRef.current =
          drag.ids.length > 1
            ? scaleObjects(objectsRef.current, drag.ids, drag.resize, p, f)
            : objectsRef.current.map((o) => (o.id === drag.ids[0] ? scaleObject(o, drag.resize as Handle, p, f) : o));
      } else {
        snapshotOnce(drag);
        setCanvasCursor("grabbing");
        const dx = p.x - drag.last.x;
        const dy = p.y - drag.last.y;
        objectsRef.current = objectsRef.current.map((o) => (drag.ids.includes(o.id) ? moveObject(o, dx, dy, f) : o));
        drag.last = p;
      }
      redraw();
      return;
    }
    if (!draftRef.current) {
      setCanvasCursor(hoverCursor(p, event.pointerType));
      return;
    }
    const draft = draftRef.current;
    if (draft.kind === "stroke") {
      draft.points = relPoints(
        draft.points.map((pt) => ({ x: pt.nx * f.w, y: pt.ny * f.h })).concat([p]),
        f
      );
    } else if (draft.kind === "shape" && (draft.shape === "line" || draft.shape === "arrow")) {
      draft.nx2 = p.x / f.w;
      draft.ny2 = p.y / f.h;
    } else if (isBoxShape(draft)) {
      const start = dragRef.current?.start || p;
      if (draft.shape === "ellipse") {
        const d = Math.max(8, Math.max(Math.abs(p.x - start.x), Math.abs(p.y - start.y)));
        writeBox(draft, { x: p.x < start.x ? start.x - d : start.x, y: p.y < start.y ? start.y - d : start.y, w: d, h: d }, f);
      } else {
        const x = Math.min(start.x, p.x);
        const y = Math.min(start.y, p.y);
        const w = Math.max(8, Math.abs(p.x - start.x));
        const h = Math.max(8, Math.abs(p.y - start.y));
        writeBox(draft, { x, y, w, h }, f);
      }
    }
    redraw();
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const p = pos(event);
    const f = field();
    if (draftRef.current) {
      const draft = draftRef.current;
      let keep = false;
      if (draft.kind === "stroke") {
        const pts = draft.points.map((pt) => ({ x: pt.nx * f.w, y: pt.ny * f.h }));
        const len = pts.reduce((n, pt, i) => {
          if (!i) return 0;
          return n + Math.hypot(pt.x - pts[i - 1].x, pt.y - pts[i - 1].y);
        }, 0);
        keep = len > 8;
        if (keep) {
          objectsRef.current = objectsRef.current.concat(draft);
          commitSelection([draft.id]);
        } else {
          toRest();
        }
      } else if (draft.kind === "shape" && (draft.shape === "line" || draft.shape === "arrow")) {
        keep = Math.hypot((draft.nx2 - draft.nx1) * f.w, (draft.ny2 - draft.ny1) * f.h) > 8;
        if (keep) {
          objectsRef.current = objectsRef.current.concat(draft);
          restWithSelection(draft.id);
        } else {
          toRest();
        }
      } else if (isBoxShape(draft)) {
        const box = objectBox(draft, f);
        if (box.w <= 10 || box.h <= 10) {
          const start = dragRef.current?.start || p;
          if (draft.shape === "ellipse") writeBox(draft, { x: start.x - 40, y: start.y - 40, w: 80, h: 80 }, f);
          else writeBox(draft, { x: start.x - 48, y: start.y - 32, w: 96, h: 64 }, f);
        }
        objectsRef.current = objectsRef.current.concat(draft);
        restWithSelection(draft.id);
        keep = true;
      }
      draftRef.current = null;
      dragRef.current = null;
      setGhost(null);
      if (keep) remember();
      redraw();
      return;
    }
    if (marqueeRef.current) {
      const box = rectFromPoints(marqueeRef.current.start, marqueeRef.current.current);
      marqueeRef.current = null;
      if (box.w > 6 || box.h > 6) {
        restWithSelectionIds(marqueeHits(objectsRef.current, box, f).map((o) => o.id));
      } else {
        restWithSelectionIds([]);
      }
      redraw();
      return;
    }
    if (dragRef.current) {
      const drag = dragRef.current;
      const moved = Math.hypot(p.x - drag.start.x, p.y - drag.start.y);
      if (drag.mayEdit && moved < 6) {
        const o = objectsRef.current.find((obj) => obj.id === drag.ids[0]);
        dragRef.current = null;
        if (o?.kind === "text") startEdit(o);
        else redraw();
        return;
      }
      if (drag.snapped || moved >= 6) remember();
    }
    dragRef.current = null;
    if (editingIdRef.current && editRef.current) {
      editRef.current.focus({ preventScroll: true });
    }
    redraw();
  }

  function firstDroppedImage(list: FileList | null) {
    return [...(list || [])].find((file) => isPosterImageMime(imageMimeFromFile(file))) || null;
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    if (frozen || dormant || reviewing || sending) return;
    if (![...event.dataTransfer.types].includes("Files")) return;
    const p = pos(event);
    lastPtrRef.current = p;
    setDropping(true);
    setGhost({ x: p.x, y: p.y });
  }

  function onDragLeave(event: React.DragEvent) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDropping(false);
    if (!pendingImageRef.current) setGhost(null);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDropping(false);
    setGhost(null);
    if (frozen || dormant || reviewing || sending) return;
    const file = firstDroppedImage(event.dataTransfer.files);
    if (!file) return;
    void dropImageFile(file, pos(event));
  }

  function hasComposition() {
    return objectsRef.current.some((o) => {
      if (o.kind === "text") return o.text.trim().length > 0;
      if (o.kind === "stroke") return o.points.length > 1;
      if (o.kind === "image") return true;
      if (o.kind === "shape" && (o.shape === "line" || o.shape === "arrow")) {
        return Math.abs(o.nx2 - o.nx1) > 0.002 || Math.abs(o.ny2 - o.ny1) > 0.002;
      }
      if (isBoxShape(o)) return o.nw > 0.01;
      return false;
    });
  }

  function openReview() {
    if (editingIdRef.current) commitEdit();
    if (!hasComposition()) {
      setEmailError("Add something to send.");
      setEmailStatus("");
      return;
    }
    setEmailError("");
    setEmailStatus("");
    restWithSelection(null);
    setReviewing(true);
    remember();
  }

  function exitReview() {
    if (sendingRef.current) return;
    setReviewing(false);
    setEmailStatus("");
    remember();
  }

  function thaw() {
    if (sendingRef.current) return;
    setFrozen(false);
    setEmailStatus("");
    commitPoster({ frozen: false });
    redraw();
  }

  async function submitSend() {
    if (frozen || sendingRef.current) return;
    if (!reviewing) {
      openReview();
      return;
    }
    const address = email.trim();
    if (!address || !EMAIL_OK.test(address)) {
      setEmailError("Enter a valid email.");
      setEmailStatus("");
      return;
    }
    setEmailError("");
    const payload = previewUrl || (canvasRef.current ? canvasToSendDataUrl(canvasRef.current) : "");
    if (!payload) {
      setEmailStatus("The send did not go through. Try again.");
      return;
    }
    sendingRef.current = true;
    setSending(true);
    try {
      const res = await fetch("/api/hbw/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: address,
          name: "",
          decision: decision.trim(),
          poster: payload,
        }),
      });
      let data: { ok?: boolean; reason?: string };
      try {
        data = (await res.json()) as { ok?: boolean; reason?: string };
      } catch {
        setEmailStatus("The send came back unreadable. Try again.");
        return;
      }
      if (data.ok) {
        setFrozen(true);
        setReviewing(false);
        commitPoster({
          objects: objectsRef.current,
          decision,
          color,
          background,
          frozen: true,
          font: "Visual",
        });
        setEmailStatus("Sent. We’ll be in touch.");
        return;
      }
      setEmailStatus(data.reason || "The send did not go through. Try again.");
    } catch {
      setEmailStatus("The send did not go through. Try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function onReset() {
    if (sendingRef.current) return;
    const dirty = objectsRef.current.length > 0 || decision.trim().length > 0 || frozen;
    if (dirty && !resetAsk) {
      setResetAsk(true);
      window.setTimeout(() => setResetAsk(false), 4000);
      return;
    }
    snapshot();
    resetPoster();
    objectsRef.current = [];
    draftRef.current = null;
    setDecision("");
    setFrozen(false);
    setColor("#e23b2e");
    setBackground(FIELD_COLOR);
    setMaking("draw");
    setPlaceKind(null);
    commitSelection([]);
    setEditingId(null);
    editingIdRef.current = null;
    setDraftText("");
    setResetAsk(false);
    setEmail("");
    setEmailError("");
    setEmailStatus("");
    setReviewing(false);
    setSending(false);
    sendingRef.current = false;
    setPreviewUrl("");
    setTray("none");
    setReposition(false);
    setGhost(null);
    setHasWork(false);
    setHasContent(false);
    redraw();
  }

  function undo() {
    if (frozen || sendingRef.current) return;
    const prev = undoRef.current.pop();
    if (!prev) return;
    objectsRef.current = prev;
    remember();
    redraw();
  }

  function deleteSelected() {
    if (!selectedIds.length) return;
    snapshot();
    const ids = new Set(selectedIds);
    objectsRef.current = objectsRef.current.filter((o) => !ids.has(o.id));
    restWithSelectionIds([]);
    remember();
    redraw();
  }

  function bring(dir: "front" | "back") {
    const moving = selectedObjects();
    if (!moving.length) return;
    snapshot();
    const ids = new Set(selectedIds);
    const rest = objectsRef.current.filter((o) => !ids.has(o.id));
    objectsRef.current = dir === "front" ? rest.concat(moving) : moving.concat(rest);
    remember();
    redraw();
  }

  function offsetCopy(obj: PosterObj): PosterObj {
    const copy = structuredClone(obj);
    copy.id = uid();
    if (copy.kind === "shape" && (copy.shape === "line" || copy.shape === "arrow")) {
      copy.nx1 += 0.02;
      copy.ny1 += 0.02;
      copy.nx2 += 0.02;
      copy.ny2 += 0.02;
    } else if (copy.kind === "stroke") {
      copy.points = copy.points.map((pt) => ({ nx: pt.nx + 0.02, ny: pt.ny + 0.02 }));
    } else if (copy.kind === "text" || copy.kind === "image" || isBoxShape(copy)) {
      copy.nx += 0.02;
      copy.ny += 0.02;
    }
    return copy;
  }

  function duplicate() {
    const moving = selectedObjects();
    if (!moving.length) return;
    snapshot();
    const copies = moving.map(offsetCopy);
    objectsRef.current = objectsRef.current.concat(copies);
    restWithSelectionIds(copies.map((o) => o.id));
    remember();
    redraw();
  }

  function applyColor(next: string) {
    setColor(next);
    commitPoster({ color: next });
    if (tray === "poster") {
      setBackground(next);
      commitPoster({ background: next });
      redraw();
      return;
    }
    const current = selected();
    if (!current || current.kind === "image" || selectedIds.length !== 1) {
      redraw();
      return;
    }
    snapshot();
    objectsRef.current = objectsRef.current.map((o) => {
      if (o.id !== current.id) return o;
      if (isBoxShape(o) && shapePaint === "outline") return { ...o, stroke: next, outline: true };
      return { ...o, color: next };
    });
    remember();
    redraw();
  }

  function choosePoster() {
    if (frozen || sendingRef.current) return;
    if (reviewing) exitReview();
    if (editingIdRef.current) commitEdit();
    if (tray === "poster") {
      setTray("none");
      return;
    }
    setMaking("rest");
    setPlaceKind(null);
    setTray("poster");
    setPaletteOpen(false);
    setReposition(false);
    setGhost(null);
  }

  function chooseWrite() {
    if (frozen || sendingRef.current) return;
    if (reviewing) exitReview();
    if (editingIdRef.current) commitEdit();
    setMaking("write");
    setPlaceKind(null);
    setTray("none");
    setPaletteOpen(false);
    setReposition(false);
    commitSelection([]);
    setGhost(null);
  }

  function chooseDraw() {
    if (frozen || sendingRef.current) return;
    if (reviewing) exitReview();
    if (editingIdRef.current) commitEdit();
    if (making === "draw" && tray === "shape") {
      setPlaceKind(null);
      setTray("draw");
      setGhost(null);
      return;
    }
    if (making === "draw" && !placeKind) {
      toRest();
      return;
    }
    setMaking("draw");
    setPlaceKind(null);
    setTray("draw");
    setPaletteOpen(false);
    setReposition(false);
    commitSelection([]);
    setGhost(null);
  }

  function chooseUpload() {
    if (frozen || sendingRef.current) return;
    if (reviewing) exitReview();
    if (editingIdRef.current) commitEdit();
    setPlaceKind(null);
    setTray("none");
    setMaking("rest");
    setPaletteOpen(false);
    setReposition(false);
    commitSelection([]);
    setGhost(null);
    fileRef.current?.click();
  }

  function armDrawPlace(kind: "line" | "arrow") {
    setPlaceKind(kind);
    setMaking("draw");
    setTray("draw");
    commitSelection([]);
    setReposition(false);
    setGhost(null);
  }

  function openShapeTray() {
    if (frozen || sendingRef.current) return;
    setMaking("draw");
    setPlaceKind(null);
    setTray("shape");
    commitSelection([]);
    setReposition(false);
    setGhost(null);
  }

  function armShape(shape: BoxShapeKind) {
    setPlaceKind(shape);
    setMaking("draw");
    setTray("shape");
    commitSelection([]);
    setReposition(false);
  }

  useEffect(() => {
    function typingTarget(event: KeyboardEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return Boolean(editingIdRef.current);
      if (target.closest("textarea, input, [contenteditable]")) return true;
      return Boolean(editingIdRef.current);
    }

    function onKey(event: KeyboardEvent) {
      if (frozen || dormant || reviewing || sending) return;
      if (event.isComposing || event.key === "Process") return;
      if (typingTarget(event)) {
        if (event.key === "Escape") {
          event.preventDefault();
          commitEdit();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (reposition) {
          setReposition(false);
          redraw();
          return;
        }
        if (selectedIdsRef.current.length && making === "rest") {
          restWithSelectionIds([]);
          redraw();
          return;
        }
        toRest();
        redraw();
        return;
      }
      if ((event.key === "Backspace" || event.key === "Delete") && selectedIdsRef.current.length) {
        event.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dormant, frozen, making, redraw, reposition, reviewing, selectedIds, sending]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (frozen || dormant || reviewing || sending) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("textarea, input, [contenteditable]")) return;
      if (editingIdRef.current) return;
      const fromFiles = [...(event.clipboardData?.files || [])].find((file) => isPosterImageMime(imageMimeFromFile(file)));
      const fromItems = [...(event.clipboardData?.items || [])]
        .filter((item) => item.kind === "file" && isPosterImageMime(item.type))
        .map((item) => item.getAsFile())
        .find((file): file is File => Boolean(file));
      const file = fromFiles || fromItems;
      if (!file) return;
      event.preventDefault();
      const f = field();
      void dropImageFile(file, lastPtrRef.current || { x: f.w * 0.5, y: f.h * 0.45 });
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [dormant, frozen, reviewing, sending]);

  const editing = objectsRef.current.find((o): o is TextObject => o.kind === "text" && o.id === editingId);
  const current = selected();
  const selectedStroke = current?.kind === "stroke" ? current : null;
  const selectedText = current?.kind === "text" ? current : null;
  const selectedImage = current?.kind === "image" ? current : null;
  const selectedBox = current && isBoxShape(current) ? current : null;
  const selectedLine =
    current?.kind === "shape" && (current.shape === "line" || current.shape === "arrow") ? current : null;
  const showNote = !hasContent && !editingId && !reviewing && !frozen && !sending && !dormant && !hidden;
  const multiSelected = selectedIds.length > 1;
  const showContext = selectedIds.length > 0 && !editingId && !reviewing && !frozen && making === "rest" && tray !== "poster";
  const fieldKind = making === "rest" ? "idle" : making;
  const liveField = field();
  const gifLayers = objectsRef.current.filter(
    (obj): obj is ImageObject =>
      obj.kind === "image" && obj.mime === "image/gif" && !selectedIds.includes(obj.id) && obj.id !== editingId
  );
  const viewedEdit = editing ? viewText(editing, field()) : null;

  useEffect(() => {
    resize();
  }, [resize, showNote, making, tray, reviewing]);

  function colourRow(active: string) {
    return (
      <div className="hbw-poster-chips" role="listbox" aria-label="Colour">
        {PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={`hbw-poster-chip${active.toLowerCase() === swatch ? " is-current" : ""}${
              swatch === "#ffffff" ? " is-light" : ""
            }`}
            style={{ background: swatch }}
            aria-label={swatch}
            aria-selected={active.toLowerCase() === swatch}
            onClick={() => applyColor(swatch)}
          />
        ))}
        <button type="button" className="hbw-poster-chip is-custom" aria-label="More colour" onClick={() => colorRef.current?.click()}>
          +
        </button>
      </div>
    );
  }

  function objectActs(opts?: { gap?: boolean }) {
    return (
      <>
        {opts?.gap === false ? null : <span className="hbw-poster-gap" aria-hidden="true" />}
        <button type="button" className="hbw-poster-tool" onClick={() => bring("back")}>
          Back
        </button>
        <button type="button" className="hbw-poster-tool" onClick={() => bring("front")}>
          Front
        </button>
        <button type="button" className="hbw-poster-tool" onClick={duplicate}>
          Duplicate
        </button>
        <button type="button" className="hbw-poster-tool" aria-label="Delete" onClick={deleteSelected}>
          <Trash />
          <span>Delete</span>
        </button>
      </>
    );
  }

  function cycleWeight(value: number, steps: number[]) {
    const i = steps.findIndex((n) => value <= n);
    return steps[(i + 1) % steps.length];
  }

  const ghostImage = pendingImageRef.current;

  return (
    <div
      ref={wrapRef}
      className={`hbw-poster-field${fieldKind ? ` is-${fieldKind}` : " is-idle"}${dormant ? " is-dormant" : ""}${
        hidden ? " is-hidden" : ""
      }${reviewing ? " is-reviewing" : ""}${sending ? " is-sending" : ""}${frozen ? " is-frozen" : ""}${
        dropping ? " is-drop" : ""
      }`}
      data-hbw-family={making}
      data-hbw-context={
        multiSelected
          ? "group"
          : selectedText
            ? "text"
            : selectedStroke
              ? "stroke"
              : selectedImage
                ? "image"
                : selectedBox || selectedLine
                  ? "shape"
                  : "none"
      }
      // Dormant means something is drawn over the Poster — the Studio, the
      // index, a project — so it is neither readable nor reachable. It only
      // started covering the project case when the shell learned to report it.
      aria-hidden={hidden || dormant ? true : undefined}
      inert={hidden || dormant || undefined}
      style={{ ["--hbw-field" as string]: background }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={frozen || reviewing || sending ? undefined : onPointerDown}
        onPointerMove={frozen || reviewing || sending ? undefined : onPointerMove}
        onPointerUp={frozen || reviewing || sending ? undefined : onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(event) => {
          if (frozen || reviewing || sending || (event.nativeEvent as PointerEvent).pointerType === "touch") return;
          const found = [...objectsRef.current].reverse().find((o) => o.kind === "text" && hit(o, pos(event), field()));
          if (found && found.kind === "text") startEdit(found);
        }}
      />
      {gifLayers.map((obj) => {
        const box = objectBox(obj, liveField);
        return (
          <img
            key={obj.id}
            className="hbw-poster-gif"
            src={obj.src}
            alt=""
            draggable={false}
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
          />
        );
      })}
      {ghost && (dropping || placeKind === "image" || isBoxPlace(placeKind)) ? (
        <div
          className={`hbw-poster-ghost${dropping || placeKind === "image" ? " is-image" : ` is-${placeKind}`}`}
          style={{
            left: ghost.x,
            top: ghost.y,
            width: dropping || placeKind === "image" ? 120 : 72,
            height:
              (dropping || placeKind === "image") && ghostImage ? 120 * (ghostImage.h / ghostImage.w) : 72,
            backgroundImage:
              (dropping || placeKind === "image") && ghostImage ? `url(${ghostImage.src})` : undefined,
          }}
        />
      ) : null}
      {showNote ? (
        <p ref={noteRef} className="hbw-poster-note">
          What are you trying to solve? Make it a poster and send it to HBW.
        </p>
      ) : null}
      {editing && viewedEdit ? (
        <textarea
          ref={editRef}
          className="hbw-poster-edit"
          autoFocus
          value={draftText}
          inputMode="text"
          enterKeyHint="enter"
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck
          style={{
            left: viewedEdit.x,
            top: viewedEdit.y,
            width: viewedEdit.w,
            minHeight: viewedEdit.h,
            height: viewedEdit.h,
            color: editing.color,
            textAlign: editing.align,
            fontFamily: `${editing.font}, Geist, sans-serif`,
            fontSize: `${viewedEdit.size}px`,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1.25,
          }}
          onChange={(event) => applyDraft(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") {
              event.preventDefault();
              suppressBlurRef.current = false;
              commitEdit();
            }
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onBlur={() => {
            if (suppressBlurRef.current) return;
            commitEdit();
          }}
          aria-label="Edit text"
        />
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif,.gif"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void addImageFile(file);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={colorRef}
        type="color"
        className="hbw-poster-color-native"
        value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#e23b2e"}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          applyColor(event.currentTarget.value);
          setPaletteOpen(false);
        }}
      />
      <IconContext.Provider value={{ weight: "light", size: 18, color: "currentColor" }}>
        <div className="hbw-poster-toolbar" role="toolbar" aria-label="Poster" aria-busy={sending || undefined}>
          <button
            type="button"
            className={`hbw-poster-title${tray === "poster" ? " is-current" : ""}`}
            aria-pressed={tray === "poster"}
            disabled={frozen || sending}
            onClick={choosePoster}
          >
            Poster
          </button>
          <div className="hbw-poster-toolbar__primary">
            <button
              type="button"
              className={`hbw-poster-tool is-icon${making === "write" && !editingId ? " is-current" : ""}`}
              aria-label="Write"
              title="Write"
              aria-pressed={making === "write" && !editingId}
              disabled={frozen || sending}
              onClick={chooseWrite}
            >
              <TextT />
              <span>Write</span>
            </button>
            <button
              type="button"
              className={`hbw-poster-tool is-icon${making === "draw" ? " is-current" : ""}`}
              aria-label="Draw"
              title="Draw"
              aria-pressed={making === "draw"}
              aria-expanded={tray === "draw" || tray === "shape"}
              disabled={frozen || sending}
              onClick={chooseDraw}
            >
              <Pencil />
              <span>Draw</span>
            </button>
            <button
              type="button"
              className={`hbw-poster-tool is-icon${making === "upload" ? " is-current" : ""}`}
              aria-label="Upload"
              title="Upload"
              aria-pressed={making === "upload"}
              disabled={frozen || sending}
              onClick={chooseUpload}
            >
              <UploadSimple />
              <span>Upload</span>
            </button>
          </div>
          <input
            className={`hbw-poster-input${emailError ? " is-invalid" : ""}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            name="email"
            value={email}
            placeholder="Your email"
            aria-label="Your email"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError || emailStatus ? "hbw-send-status" : undefined}
            readOnly={frozen || sending}
            onChange={(e) => {
              if (frozen || sending) return;
              setEmail(e.target.value);
              if (emailError) setEmailError("");
              if (emailStatus) setEmailStatus("");
            }}
          />
          <div className="hbw-poster-toolbar__send">
            <button
              type="button"
              className={`hbw-poster-send-open${reviewing ? " is-current" : ""}`}
              aria-label="Send to HBW"
              aria-pressed={reviewing || undefined}
              disabled={frozen || sending}
              onClick={() => void submitSend()}
            >
              <PaperPlaneTilt />
              <span>Send to HBW</span>
            </button>
          </div>
          {emailError || emailStatus ? (
            <p
              id="hbw-send-status"
              className={`hbw-poster-send-status${emailError ? " is-invalid" : ""}`}
              role="status"
            >
              {emailError || emailStatus}
            </p>
          ) : null}
          {reviewing && !frozen ? (
            <div className="hbw-poster-toolbar__review">
              <label className="hbw-poster-type__label" htmlFor="hbw-poster-decision">
                What are you trying to solve?
              </label>
              <textarea
                id="hbw-poster-decision"
                className="hbw-poster-toolbar__message"
                rows={3}
                value={decision}
                readOnly={sending}
                data-gramm="false"
                onChange={(event) => {
                  if (sending) return;
                  setDecision(event.target.value);
                  commitPoster({ decision: event.target.value });
                }}
              />
            </div>
          ) : null}
          {tray === "draw" && !reviewing && !frozen ? (
            <div className="hbw-poster-toolbar__tray" data-stage="draw">
              <button type="button" className="hbw-poster-tool" aria-label="Shape" onClick={openShapeTray}>
                <Rectangle />
                <span>Shape</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool${placeKind === "line" ? " is-current" : ""}`}
                aria-label="Line"
                onClick={() => armDrawPlace("line")}
              >
                <LineSegment />
                <span>Line</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool${placeKind === "arrow" ? " is-current" : ""}`}
                aria-label="Arrow"
                onClick={() => armDrawPlace("arrow")}
              >
                <ArrowUpRight />
                <span>Arrow</span>
              </button>
              {colourRow(color)}
            </div>
          ) : null}
          {tray === "shape" && !reviewing && !frozen ? (
            <div className="hbw-poster-toolbar__tray is-shapes" data-stage="shape">
              <button
                type="button"
                className={`hbw-poster-tool is-icon${placeKind === "rect" ? " is-current" : ""}`}
                aria-label="Rectangle"
                title="Rectangle"
                onClick={() => armShape("rect")}
              >
                <Rectangle />
                <span>Rectangle</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool is-icon${placeKind === "ellipse" ? " is-current" : ""}`}
                aria-label="Circle"
                title="Circle"
                onClick={() => armShape("ellipse")}
              >
                <Circle />
                <span>Circle</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool is-icon${placeKind === "triangle" ? " is-current" : ""}`}
                aria-label="Triangle"
                title="Triangle"
                onClick={() => armShape("triangle")}
              >
                <Triangle />
                <span>Triangle</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool is-icon${placeKind === "star" ? " is-current" : ""}`}
                aria-label="Star"
                title="Star"
                onClick={() => armShape("star")}
              >
                <Star />
                <span>Star</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool is-icon${placeKind === "blob" ? " is-current" : ""}`}
                aria-label="Blob"
                title="Blob"
                onClick={() => armShape("blob")}
              >
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    d="M9.6 2.2c2.8-.3 5.6 1.8 5.8 4.6.2 2.2-1 3.4-1.6 5.1-.7 2-3.2 3.6-5.4 3.2C5.8 14.7 3 13.2 2.4 10.6 1.8 8.2 3.4 5.6 5.6 4.2 7 3.3 8.2 2.3 9.6 2.2z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
                <span>Blob</span>
              </button>
              {colourRow(color)}
            </div>
          ) : null}
          {tray === "poster" && !reviewing && !frozen ? (
            <div className="hbw-poster-toolbar__context" data-stage="poster">
              <span className="hbw-poster-type__label">Background</span>
              {colourRow(background)}
            </div>
          ) : null}
          {showContext && multiSelected ? (
            <div className="hbw-poster-toolbar__context" data-stage="group">
              {objectActs({ gap: false })}
            </div>
          ) : null}
          {showContext && !multiSelected && selectedText ? (
            <div className="hbw-poster-toolbar__context" data-stage="text">
              <button
                type="button"
                className="hbw-poster-tool"
                onPointerDown={(event) => {
                  event.preventDefault();
                  startEdit(selectedText);
                }}
              >
                Edit
              </button>
              {colourRow(selectedText.color)}
              {objectActs()}
            </div>
          ) : null}
          {showContext && !multiSelected && selectedBox ? (
            <div className="hbw-poster-toolbar__context" data-stage="shape">
              <button
                type="button"
                className={`hbw-poster-tool${shapePaint === "fill" ? " is-current" : ""}`}
                aria-pressed={selectedBox.fill}
                onClick={() => {
                  const hide = shapePaint === "fill" && selectedBox.fill && selectedBox.outline;
                  snapshot();
                  objectsRef.current = objectsRef.current.map((o) =>
                    o.id === selectedBox.id && isBoxShape(o)
                      ? { ...o, fill: hide ? false : true, outline: hide ? true : o.outline || !o.fill }
                      : o
                  );
                  setShapePaint("fill");
                  remember();
                  redraw();
                }}
              >
                Fill
              </button>
              <button
                type="button"
                className={`hbw-poster-tool${shapePaint === "outline" ? " is-current" : ""}`}
                aria-pressed={selectedBox.outline}
                onClick={() => {
                  const hide = shapePaint === "outline" && selectedBox.outline && selectedBox.fill;
                  snapshot();
                  objectsRef.current = objectsRef.current.map((o) =>
                    o.id === selectedBox.id && isBoxShape(o)
                      ? { ...o, outline: hide ? false : true, fill: hide ? true : o.fill || !o.outline }
                      : o
                  );
                  setShapePaint("outline");
                  remember();
                  redraw();
                }}
              >
                Outline
              </button>
              {selectedBox.outline ? (
                <button
                  type="button"
                  className="hbw-poster-tool"
                  onClick={() => {
                    snapshot();
                    const next = cycleWeight(selectedBox.weight, [1, 3, 6]);
                    objectsRef.current = objectsRef.current.map((o) =>
                      o.id === selectedBox.id && isBoxShape(o) ? { ...o, weight: next } : o
                    );
                    remember();
                    redraw();
                  }}
                >
                  {selectedBox.weight <= 1 ? "Thin" : selectedBox.weight <= 3 ? "Mid" : "Thick"}
                </button>
              ) : null}
              {colourRow(shapePaint === "outline" ? selectedBox.stroke || selectedBox.color : selectedBox.color)}
              {objectActs()}
            </div>
          ) : null}
          {showContext && !multiSelected && selectedImage ? (
            <div className="hbw-poster-toolbar__context" data-stage="image">
              {objectActs({ gap: false })}
            </div>
          ) : null}
          {showContext && !multiSelected && (selectedStroke || selectedLine) ? (
            <div className="hbw-poster-toolbar__context" data-stage="stroke">
              <button
                type="button"
                className="hbw-poster-tool"
                onClick={() => {
                  const currentLine = selectedLine;
                  const currentStroke = selectedStroke;
                  snapshot();
                  if (currentStroke) {
                    const next = cycleWeight(currentStroke.width, [1.8, 4.5, 8]);
                    objectsRef.current = objectsRef.current.map((o) =>
                      o.id === currentStroke.id && o.kind === "stroke" ? { ...o, width: next } : o
                    );
                  } else if (currentLine) {
                    const next = cycleWeight(currentLine.weight, [1.2, 3, 6]);
                    objectsRef.current = objectsRef.current.map((o) =>
                      o.id === currentLine.id && o.kind === "shape" && (o.shape === "line" || o.shape === "arrow")
                        ? { ...o, weight: next }
                        : o
                    );
                  }
                  remember();
                  redraw();
                }}
              >
                {(selectedStroke ? selectedStroke.width : selectedLine?.weight || 2) <= 2
                  ? "Thin"
                  : (selectedStroke ? selectedStroke.width : selectedLine?.weight || 2) <= 5
                    ? "Mid"
                    : "Thick"}
              </button>
              {colourRow((selectedStroke || selectedLine)!.color)}
              {selectedLine?.shape === "arrow" ? (
                <button
                  type="button"
                  className="hbw-poster-tool"
                  onClick={() => {
                    snapshot();
                    objectsRef.current = objectsRef.current.map((o) => {
                      if (o.id !== selectedLine.id || o.kind !== "shape" || o.shape !== "arrow") return o;
                      return { ...o, nx1: o.nx2, ny1: o.ny2, nx2: o.nx1, ny2: o.ny1 };
                    });
                    remember();
                    redraw();
                  }}
                >
                  Reverse
                </button>
              ) : null}
              {objectActs()}
            </div>
          ) : null}
          {hasWork ? (
            <div className="hbw-poster-toolbar__work">
              <button
                type="button"
                className="hbw-poster-tool"
                aria-label="Undo"
                disabled={frozen || sending || !undoRef.current.length}
                onClick={undo}
              >
                <ArrowUUpLeft />
              </button>
              {frozen ? (
                <button type="button" className="hbw-poster-reset" onClick={thaw}>
                  Keep making
                </button>
              ) : null}
              <button type="button" className={`hbw-poster-reset${resetAsk ? " is-ask" : ""}`} onClick={onReset}>
                {resetAsk ? "Reset?" : "Reset"}
              </button>
            </div>
          ) : null}
        </div>
      </IconContext.Provider>
    </div>
  );
});
