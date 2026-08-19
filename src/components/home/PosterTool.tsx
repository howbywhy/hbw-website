"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Rectangle,
  ArrowUpRight,
  AlignCenterHorizontal,
  AlignLeft,
  AlignRight,
  ArrowUUpLeft,
  IconContext,
  Image as ImageIcon,
  LineSegment,
  PencilSimple,
  Plus,
  Cursor,
  TextT,
  Trash,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { canvasToSendDataUrl, fileToImageObjectSource } from "@/components/home/poster/image";
import { hit, measureTextBlock, moveObject, nearHandle, paint, scaleObject, uid } from "@/components/home/poster/paint";
import { recogniseEnabled, recogniseStrokes } from "@/components/home/poster/recognise";
import { restoreStroke, smoothStroke } from "@/components/home/poster/smooth";
import {
  PALETTE,
  POSTER_FONTS,
  type PosterFont,
  type PosterObj,
  type PosterToolId,
  type Pt,
  type ShapeKind,
  type StrokeObject,
  type TextAlign,
  type TextObject,
} from "@/components/home/poster/types";
import {
  hydrateWorkspace,
  persistWorkspace,
  resetPoster,
  workspace,
} from "@/components/home/workspace";

type Family = "select" | "write" | "add" | "draw";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function commitPoster(partial: Partial<typeof workspace.poster>) {
  Object.assign(workspace.poster, partial);
  persistWorkspace();
}

type Props = {
  dormant?: boolean;
  hidden?: boolean;
};

export function PosterTool({ dormant = false, hidden = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const objectsRef = useRef<PosterObj[]>([]);
  const draftRef = useRef<PosterObj | null>(null);
  const dragRef = useRef<{ id: string; last: Pt; resize: boolean } | null>(null);
  const undoRef = useRef<PosterObj[][]>([]);
  const editingIdRef = useRef<string | null>(null);
  const skipIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const suppressBlurRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const colorRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<PosterToolId>("select");
  const [family, setFamily] = useState<Family>("select");
  const [armed, setArmed] = useState<Exclude<Family, "select"> | null>(null);
  const [color, setColor] = useState("#e23b2e");
  const [decision, setDecision] = useState("");
  const [email, setEmail] = useState("");
  const [frozen, setFrozen] = useState(false);
  const [resetAsk, setResetAsk] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [font, setFont] = useState<PosterFont>("Visual");
  const [textSize, setTextSize] = useState(28);
  const [align, setAlign] = useState<TextAlign>("left");
  const [shape, setShape] = useState<ShapeKind>("rect");
  const [shapeFill, setShapeFill] = useState(false);
  const [tray, setTray] = useState<"none" | "add">("none");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hasWork, setHasWork] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [preview, setPreview] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  editingIdRef.current = editingId;
  skipIdRef.current = editingId;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const wrap = wrapRef.current;
    const caption = frozen && decision.trim() ? decision.trim() : undefined;
    paint(ctx, objectsRef.current, draftRef.current, wrap?.clientWidth ?? 0, wrap?.clientHeight ?? 0, {
      selectedId: frozen || reviewing ? null : selectedId,
      chrome: !frozen && !reviewing,
      caption,
      skipId: skipIdRef.current,
    });
  }, [decision, frozen, reviewing, selectedId]);

  const resize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const keyboard =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--hbw-vv-inset")
      ) > 0;
    if ((editingIdRef.current || keyboard) && sizeRef.current.w === w && sizeRef.current.h !== h) return;
    sizeRef.current = { w, h };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      hydrateWorkspace();
      objectsRef.current = workspace.poster.objects.filter((o) => o.id !== "decision");
      setTool("select");
      setColor(workspace.poster.color);
      setDecision(workspace.poster.decision);
      setFrozen(workspace.poster.frozen);
      setFont(workspace.poster.font);
      setTextSize(workspace.poster.textSize);
      setAlign(workspace.poster.align);
      setShape(workspace.poster.shape);
      setShapeFill(workspace.poster.shapeFill);
      setFamily("select");
      setArmed(null);
      setHasWork(objectsRef.current.length > 0);
    }
    resize();
    window.addEventListener("resize", resize);
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
    if (!reviewing || frozen) return;
    const canvas = canvasRef.current;
    if (canvas) setPreviewUrl(canvasToSendDataUrl(canvas));
  }, [redraw, preview, reviewing, frozen]);

  function snapshot() {
    undoRef.current = undoRef.current.concat([objectsRef.current.map((o) => structuredClone(o))]).slice(-40);
  }

  function remember() {
    commitPoster({
      objects: objectsRef.current,
      decision,
      color,
      frozen,
      tool,
      font,
      textSize,
      align,
      shape,
      shapeFill,
    });
    setHasWork(objectsRef.current.length > 0 || undoRef.current.length > 0);
  }

  function pos(event: { clientX: number; clientY: number }): Pt {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }

  function selected(): PosterObj | undefined {
    return objectsRef.current.find((o) => o.id === selectedId);
  }

  function startEdit(obj: TextObject) {
    suppressBlurRef.current = true;
    editingIdRef.current = obj.id;
    skipIdRef.current = obj.id;
    const h = measureTextBlock(obj).h;
    if (h !== obj.h) {
      objectsRef.current = objectsRef.current.map((o) =>
        o.id === obj.id && o.kind === "text" ? { ...o, h } : o
      );
    }
    setDraftText(obj.text);
    setEditingId(obj.id);
    setSelectedId(obj.id);
    setFont(obj.font);
    setTextSize(obj.size);
    setAlign(obj.align);
    setFamily("write");
    setTool("text");
    void document.fonts.load(`400 ${obj.size}px ${obj.font}`);
  }

  function applyDraft(text: string) {
    const id = editingIdRef.current;
    setDraftText(text);
    if (!id) return;
    objectsRef.current = objectsRef.current.map((o) => {
      if (o.id !== id || o.kind !== "text") return o;
      const next = { ...o, text };
      return { ...next, h: measureTextBlock(next).h };
    });
    redraw();
  }

  function commitEdit() {
    const id = editingIdRef.current;
    if (!id) return;
    const obj = objectsRef.current.find((o) => o.id === id);
    if (obj?.kind === "text" && !obj.text.trim()) {
      objectsRef.current = objectsRef.current.filter((o) => o.id !== id);
      setSelectedId(null);
    }
    editingIdRef.current = null;
    skipIdRef.current = null;
    setEditingId(null);
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

  async function addImageFile(file: File, at?: Pt) {
    try {
      snapshot();
      const source = await fileToImageObjectSource(file);
      const canvas = canvasRef.current;
      const maxW = Math.min(320, (canvas?.clientWidth || 640) * 0.4);
      const ratio = source.h / Math.max(1, source.w);
      const w = maxW;
      const h = maxW * ratio;
      const p = at || { x: 48, y: 48 };
      objectsRef.current = objectsRef.current.concat({
        id: uid(),
        kind: "image",
        x: p.x,
        y: p.y,
        w,
        h,
        src: source.src,
        mime: source.mime,
      });
      remember();
      redraw();
      chooseSelect();
    } catch {
      /* ignore unsupported */
    }
  }

  function selectObject(found: PosterObj, p: Pt) {
    setSelectedId(found.id);
    if (found.kind === "text") {
      setFont(found.font);
      setTextSize(found.size);
      setAlign(found.align);
    }
    dragRef.current = { id: found.id, last: p, resize: nearHandle(found, p) };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (frozen || dormant || reviewing) return;
    if (family === "draw") event.preventDefault();
    const p = pos(event);
    const found = [...objectsRef.current].reverse().find((o) => hit(o, p));
    const wasEditing = editingIdRef.current;

    if (wasEditing) {
      const wasId = wasEditing;
      commitEdit();
      if (found?.kind === "text" && found.id !== wasId) {
        startEdit(found);
        return;
      }
      if (found && found.kind !== "text") {
        selectObject(found, p);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* optional */
        }
        return;
      }
      setSelectedId(null);
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* optional */
    }
    if (found) {
      if (family === "write" && found.kind === "text") {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* optional */
        }
        startEdit(found);
        return;
      }
      selectObject(found, p);
      return;
    }
    setSelectedId(null);
    if (family === "select") return;
    if (tool === "text" || family === "write") {
      snapshot();
      const obj: TextObject = {
        id: uid(),
        kind: "text",
        x: p.x,
        y: p.y,
        w: 280,
        h: 48,
        text: "",
        color,
        font,
        size: textSize,
        align,
      };
      objectsRef.current = objectsRef.current.concat(obj);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* optional */
      }
      startEdit(obj);
      redraw();
      return;
    }
    if (tool === "upload") {
      fileRef.current?.click();
      return;
    }
    snapshot();
    if (tool === "pencil" || tool === "marker" || family === "draw") {
      draftRef.current = {
        id: uid(),
        kind: "stroke",
        points: [p],
        color,
        width: tool === "marker" ? 8 : 1.6,
      };
      return;
    }
    if (tool === "shape") {
      draftRef.current = {
        id: uid(),
        kind: "shape",
        shape,
        a: p,
        b: p,
        color,
        fill: shape === "rect" || shape === "ellipse" ? shapeFill : false,
      };
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (frozen || dormant || reviewing) return;
    const p = pos(event);
    if (dragRef.current) {
      const dx = p.x - dragRef.current.last.x;
      const dy = p.y - dragRef.current.last.y;
      objectsRef.current = objectsRef.current.map((o) => {
        if (o.id !== dragRef.current!.id) return o;
        if (dragRef.current!.resize) {
          return scaleObject(o, p, {
            x: o.kind === "text" || o.kind === "image" ? o.x : p.x,
            y: o.kind === "text" || o.kind === "image" ? o.y : p.y,
          });
        }
        return moveObject(o, dx, dy);
      });
      dragRef.current.last = p;
      redraw();
      return;
    }
    const draft = draftRef.current;
    if (!draft) return;
    if (draft.kind === "stroke") draft.points.push(p);
    else if (draft.kind === "shape") draft.b = p;
    redraw();
  }

  function onPointerUp() {
    if (draftRef.current) {
      objectsRef.current = objectsRef.current.concat(draftRef.current);
      draftRef.current = null;
      remember();
      redraw();
    } else if (dragRef.current) {
      remember();
    }
    dragRef.current = null;
    if (editingIdRef.current && editRef.current) {
      editRef.current.focus({ preventScroll: true });
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    if (frozen || dormant || reviewing) return;
    const file = event.dataTransfer.files[0];
    if (file) void addImageFile(file, pos(event));
  }

  function hasComposition() {
    return objectsRef.current.some((o) => {
      if (o.kind === "text") return o.text.trim().length > 0;
      if (o.kind === "stroke") return o.points.length > 1;
      if (o.kind === "image") return true;
      if (o.kind === "shape") {
        return Math.abs(o.b.x - o.a.x) > 2 || Math.abs(o.b.y - o.a.y) > 2;
      }
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
    setSelectedId(null);
    setReviewing(true);
    remember();
  }

  function exitReview() {
    setReviewing(false);
    setEmailStatus("");
    remember();
  }

  async function submitSend() {
    if (frozen) return;
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
    setEmailStatus("Sending…");
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
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (data.ok) {
        setFrozen(true);
        commitPoster({
          objects: objectsRef.current,
          decision,
          color,
          frozen: true,
          tool,
          font,
          textSize,
          align,
          shape,
          shapeFill,
        });
        setEmailStatus("Sent.");
        return;
      }
      setEmailStatus(data.reason || "The send did not go through. Try again.");
    } catch {
      setEmailStatus("The send did not go through. Try again.");
    }
  }

  function onReset() {
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
    setTool("select");
    setFamily("select");
    setArmed(null);
    setSelectedId(null);
    setEditingId(null);
    editingIdRef.current = null;
    setDraftText("");
    setResetAsk(false);
    setEmail("");
    setEmailError("");
    setEmailStatus("");
    setReviewing(false);
    setPreviewUrl("");
    setTray("none");
    setHasWork(false);
    redraw();
  }

  function undo() {
    const prev = undoRef.current.pop();
    if (!prev) return;
    objectsRef.current = prev;
    remember();
    redraw();
  }

  function deleteSelected() {
    if (!selectedId) return;
    snapshot();
    objectsRef.current = objectsRef.current.filter((o) => o.id !== selectedId);
    setSelectedId(null);
    setEditingId(null);
    remember();
    redraw();
  }

  function onSmooth() {
    const current = selected();
    if (!current || current.kind !== "stroke") return;
    snapshot();
    objectsRef.current = objectsRef.current.map((o) =>
      o.id === current.id && o.kind === "stroke" ? smoothStroke(o) : o
    );
    remember();
    redraw();
  }

  function onRestoreStroke() {
    const current = selected();
    if (!current || current.kind !== "stroke" || !current.originalPoints) return;
    snapshot();
    objectsRef.current = objectsRef.current.map((o) =>
      o.id === current.id && o.kind === "stroke" ? restoreStroke(o) : o
    );
    remember();
    redraw();
  }

  async function onRecognise() {
    if (!recogniseEnabled()) return;
    const strokes = objectsRef.current.filter(
      (o): o is StrokeObject => o.kind === "stroke" && (!selectedId || o.id === selectedId)
    );
    if (!strokes.length) return;
    try {
      const result = await recogniseStrokes(strokes);
      setPreview(result.text);
    } catch {
      setPreview("");
    }
  }

  function setCurrentTool(next: PosterToolId) {
    setTool(next);
    commitPoster({ tool: next });
  }

  function chooseSelect() {
    setFamily("select");
    setArmed(null);
    setTray("none");
    setPaletteOpen(false);
    setCurrentTool("select");
  }

  function chooseFamily(next: Exclude<Family, "select">) {
    setPaletteOpen(false);
    setArmed(null);
    setFamily(next);
    if (next === "write") {
      setCurrentTool("text");
      setTray("none");
    } else if (next === "draw") {
      setCurrentTool(tool === "marker" ? "marker" : "pencil");
      setTray("none");
    } else if (next === "add") {
      setTray("add");
      setCurrentTool("upload");
    }
  }

  function patchSelectedText(partial: Partial<TextObject>) {
    if (!selectedId) return;
    objectsRef.current = objectsRef.current.map((o) => {
      if (o.id !== selectedId || o.kind !== "text") return o;
      const next = { ...o, ...partial };
      return { ...next, h: measureTextBlock(next).h };
    });
    remember();
    redraw();
  }

  function applyColor(next: string) {
    setColor(next);
    commitPoster({ color: next });
    const current = selected();
    if (current?.kind === "text") patchSelectedText({ color: next });
    if (current?.kind === "stroke") {
      objectsRef.current = objectsRef.current.map((o) =>
        o.id === current.id && o.kind === "stroke" ? { ...o, color: next } : o
      );
      remember();
      redraw();
    }
  }

  function toNeutral() {
    if (editingIdRef.current) commitEdit();
    chooseSelect();
    setSelectedId(null);
    setEditingId(null);
  }

  useEffect(() => {
    function typingTarget(event: KeyboardEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return Boolean(editingIdRef.current);
      if (target.closest("textarea, input, [contenteditable]")) return true;
      return Boolean(editingIdRef.current);
    }

    function onKey(event: KeyboardEvent) {
      if (frozen || dormant || reviewing) return;
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
        toNeutral();
        return;
      }
      if ((event.key === "Backspace" || event.key === "Delete") && selectedId) {
        event.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dormant, frozen, reviewing, selectedId]);

  const fieldKind = family === "select" ? armed || "select" : family;
  const editing = objectsRef.current.find((o): o is TextObject => o.kind === "text" && o.id === editingId);
  const current = selected();
  const selectedStroke = current?.kind === "stroke" ? current : null;
  const selectedText = current?.kind === "text" || editing ? true : false;
  const selectedImage = current?.kind === "image";
  const textActive = selectedText || Boolean(editing);
  const AlignIcon = align === "center" ? AlignCenterHorizontal : align === "right" ? AlignRight : AlignLeft;

  return (
    <div
      ref={wrapRef}
      className={`hbw-poster-field${fieldKind ? ` is-${fieldKind}` : " is-idle"}${
        family === "select" && armed ? " is-armed" : ""
      }${dormant ? " is-dormant" : ""}${hidden ? " is-hidden" : ""}${reviewing ? " is-reviewing" : ""}${
        frozen ? " is-frozen" : ""
      }`}
      data-hbw-family={family || "idle"}
      data-hbw-context={textActive ? "text" : selectedStroke ? "stroke" : selectedImage ? "image" : "none"}
      aria-hidden={hidden ? true : undefined}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={reviewing ? undefined : onPointerDown}
        onPointerMove={reviewing ? undefined : onPointerMove}
        onPointerUp={reviewing ? undefined : onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(event) => {
          if (frozen || reviewing) return;
          const found = [...objectsRef.current].reverse().find((o) => o.kind === "text" && hit(o, pos(event)));
          if (found && found.kind === "text") startEdit(found);
        }}
      />
      {editing ? (
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
            left: editing.x,
            top: editing.y,
            width: editing.w,
            minHeight: editing.h,
            height: editing.h,
            color: editing.color,
            textAlign: editing.align,
            fontFamily: `${editing.font}, Geist, sans-serif`,
            fontSize: `${editing.size}px`,
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
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        hidden
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
      {reviewing ? (
        <div className="hbw-poster-review" aria-label="Review poster">
          <div className="hbw-poster-review__copy">
            <label className="hbw-poster-review__label" htmlFor="hbw-poster-decision">
              What are you trying to solve?
            </label>
            <textarea
              id="hbw-poster-decision"
              className="hbw-poster-review__summary"
              rows={3}
              value={decision}
              readOnly={frozen}
              onChange={(event) => {
                if (frozen) return;
                setDecision(event.target.value);
                commitPoster({ decision: event.target.value });
              }}
            />
            <label className="hbw-poster-review__label" htmlFor="hbw-poster-review-email">
              Your email
            </label>
            <input
              id="hbw-poster-review-email"
              className={`hbw-poster-review__email${emailError ? " is-invalid" : ""}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              name="email"
              value={email}
              aria-invalid={emailError ? true : undefined}
              readOnly={frozen}
              onChange={(event) => {
                if (frozen) return;
                setEmail(event.target.value);
                if (emailError) setEmailError("");
                if (emailStatus) setEmailStatus("");
              }}
            />
            {emailError || emailStatus ? (
              <p className={`hbw-poster-send-status${emailError ? " is-invalid" : ""}`} role="status">
                {emailError || emailStatus}
              </p>
            ) : null}
            <div className="hbw-poster-review__actions">
              <button type="button" className="hbw-poster-review__back" onClick={exitReview}>
                Edit poster
              </button>
              <button type="button" className="hbw-poster-review__send" disabled={frozen} onClick={() => void submitSend()}>
                Send to HBW
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <IconContext.Provider value={{ weight: "light", size: 18, color: "currentColor" }}>
          {!reviewing ? (
          <div className="hbw-poster-toolbar" role="toolbar" aria-label="Make">
            <div
              className="hbw-poster-toolbar__primary"
              onPointerLeave={() => {
                if (family === "select") setArmed(null);
              }}
            >
              <button
                type="button"
                className={`hbw-poster-tool${family === "select" ? " is-current" : ""}`}
                aria-label="Select"
                aria-pressed={family === "select"}
                onClick={() => chooseSelect()}
              >
                <Cursor />
                <span>Select</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool${family === "write" ? " is-current" : ""}`}
                aria-label="Write"
                aria-pressed={family === "write"}
                onPointerEnter={() => {
                  if (family === "select" && !dormant) setArmed("write");
                }}
                onFocus={() => {
                  if (family === "select" && !dormant) setArmed("write");
                }}
                onClick={() => chooseFamily("write")}
              >
                <TextT />
                <span>Write</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool${family === "draw" ? " is-current" : ""}`}
                aria-label="Draw"
                aria-pressed={family === "draw"}
                onPointerEnter={() => {
                  if (family === "select" && !dormant) setArmed("draw");
                }}
                onFocus={() => {
                  if (family === "select" && !dormant) setArmed("draw");
                }}
                onClick={() => chooseFamily("draw")}
              >
                <PencilSimple />
                <span>Draw</span>
              </button>
              <button
                type="button"
                className={`hbw-poster-tool${family === "add" ? " is-current" : ""}`}
                aria-label="Add"
                aria-pressed={family === "add"}
                aria-expanded={tray === "add"}
                onPointerEnter={() => {
                  if (family === "select" && !dormant) setArmed("add");
                }}
                onFocus={() => {
                  if (family === "select" && !dormant) setArmed("add");
                }}
                onClick={() => chooseFamily("add")}
              >
                <Plus />
                <span>Add</span>
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
                if (emailStatus) setEmailStatus("");
              }}
            />
            <div className="hbw-poster-toolbar__send">
              {emailError || emailStatus ? (
                <p
                  id="hbw-send-status"
                  className={`hbw-poster-send-status${emailError ? " is-invalid" : ""}`}
                  role="status"
                >
                  {emailError || emailStatus}
                </p>
              ) : null}
              <button
                type="button"
                className="hbw-poster-send-open"
                aria-label="Send"
                onClick={() => void submitSend()}
              >
                <PaperPlaneTilt />
                <span>Send</span>
              </button>
            </div>
            {tray === "add" ? (
              <div className="hbw-poster-toolbar__tray" data-stage="add">
                <button type="button" className="hbw-poster-tool" aria-label="Upload image" onClick={() => fileRef.current?.click()}>
                  <ImageIcon />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  className={`hbw-poster-tool${tool === "shape" && shape === "rect" ? " is-current" : ""}`}
                  aria-label="Shape"
                  onClick={() => {
                    setShape("rect");
                    setCurrentTool("shape");
                    commitPoster({ shape: "rect" });
                  }}
                >
                  <Rectangle />
                  <span>Shape</span>
                </button>
                <button
                  type="button"
                  className={`hbw-poster-tool${tool === "shape" && shape === "arrow" ? " is-current" : ""}`}
                  aria-label="Arrow"
                  onClick={() => {
                    setShape("arrow");
                    setCurrentTool("shape");
                    commitPoster({ shape: "arrow" });
                  }}
                >
                  <ArrowUpRight />
                  <span>Arrow</span>
                </button>
                <button
                  type="button"
                  className={`hbw-poster-tool${tool === "shape" && shape === "line" ? " is-current" : ""}`}
                  aria-label="Line"
                  onClick={() => {
                    setShape("line");
                    setCurrentTool("shape");
                    commitPoster({ shape: "line" });
                  }}
                >
                  <LineSegment />
                  <span>Line</span>
                </button>
              </div>
            ) : null}
            {family === "draw" && !current ? (
              <div className="hbw-poster-toolbar__context" data-stage="draw">
                <button
                  type="button"
                  className={`hbw-poster-tool${tool === "pencil" ? " is-current" : ""}`}
                  aria-label="Pencil"
                  aria-pressed={tool === "pencil"}
                  onClick={() => setCurrentTool("pencil")}
                >
                  <PencilSimple />
                  <span>Pencil</span>
                </button>
                <button
                  type="button"
                  className={`hbw-poster-tool${tool === "marker" ? " is-current" : ""}`}
                  aria-label="Marker"
                  aria-pressed={tool === "marker"}
                  onClick={() => setCurrentTool("marker")}
                >
                  <span>Marker</span>
                </button>
                <button
                  type="button"
                  className={`hbw-poster-swatch${paletteOpen ? " is-open" : ""}`}
                  style={{ background: color }}
                  aria-label="Stroke colour"
                  aria-expanded={paletteOpen}
                  onClick={() => setPaletteOpen((open) => !open)}
                />
              </div>
            ) : null}
            {(textActive || (family === "write" && !current)) ? (
              <div className="hbw-poster-toolbar__context" data-stage="text">
                <label className="hbw-poster-type">
                  <span className="hbw-poster-type__label">Typeface</span>
                  <select
                    value={font}
                    aria-label="Typeface"
                    onChange={(event) => {
                      const next = event.target.value as PosterFont;
                      setFont(next);
                      commitPoster({ font: next });
                      patchSelectedText({ font: next });
                      void document.fonts.load(`400 ${textSize}px ${next}`);
                    }}
                  >
                    {POSTER_FONTS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="hbw-poster-quiet"
                  aria-label="Text size"
                  onClick={() => {
                    const next = textSize >= 36 ? 18 : textSize + 6;
                    setTextSize(next);
                    commitPoster({ textSize: next });
                    patchSelectedText({ size: next });
                  }}
                >
                  {textSize}
                </button>
                <button
                  type="button"
                  className="hbw-poster-quiet"
                  aria-label="Alignment"
                  onClick={() => {
                    const next: TextAlign = align === "left" ? "center" : align === "center" ? "right" : "left";
                    setAlign(next);
                    commitPoster({ align: next });
                    patchSelectedText({ align: next });
                  }}
                >
                  <AlignIcon />
                </button>
                <button
                  type="button"
                  className={`hbw-poster-swatch${paletteOpen ? " is-open" : ""}`}
                  style={{ background: color }}
                  aria-label="Colour"
                  aria-expanded={paletteOpen}
                  onClick={() => setPaletteOpen((open) => !open)}
                />
                <button type="button" className="hbw-poster-tool" aria-label="Delete" onClick={deleteSelected}>
                  <Trash />
                </button>
              </div>
            ) : null}
            {selectedStroke ? (
              <div className="hbw-poster-toolbar__context" data-stage="stroke">
                <button
                  type="button"
                  className={`hbw-poster-swatch${paletteOpen ? " is-open" : ""}`}
                  style={{ background: color }}
                  aria-label="Colour"
                  aria-expanded={paletteOpen}
                  onClick={() => setPaletteOpen((open) => !open)}
                />
                <button type="button" className="hbw-poster-tool" aria-label="Delete" onClick={deleteSelected}>
                  <Trash />
                </button>
              </div>
            ) : null}
            {selectedImage ? (
              <div className="hbw-poster-toolbar__context" data-stage="image">
                <button type="button" className="hbw-poster-tool" aria-label="Delete" onClick={deleteSelected}>
                  <Trash />
                </button>
              </div>
            ) : null}
            {paletteOpen ? (
              <div className="hbw-poster-palette" role="listbox" aria-label="Colour">
                {PALETTE.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    className={`hbw-poster-palette__swatch${color.toLowerCase() === swatch ? " is-current" : ""}`}
                    style={{ background: swatch }}
                    aria-label={swatch}
                    aria-selected={color.toLowerCase() === swatch}
                    onClick={() => {
                      applyColor(swatch);
                      setPaletteOpen(false);
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="hbw-poster-palette__swatch is-custom"
                  aria-label="Custom colour"
                  onClick={() => colorRef.current?.click()}
                />
              </div>
            ) : null}
            {hasWork ? (
              <>
                <button type="button" className="hbw-poster-tool" aria-label="Undo" disabled={!undoRef.current.length} onClick={undo}>
                  <ArrowUUpLeft />
                </button>
                <button type="button" className={`hbw-poster-reset${resetAsk ? " is-ask" : ""}`} onClick={onReset}>
                  {resetAsk ? "Reset?" : "Reset"}
                </button>
              </>
            ) : null}
          </div>
          ) : null}
      </IconContext.Provider>
    </div>
  );
}
