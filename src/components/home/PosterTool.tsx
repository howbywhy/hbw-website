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
  TextT,
  Trash,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { fileToImageObjectSource } from "@/components/home/poster/image";
import { hit, moveObject, nearHandle, paint, scaleObject, uid } from "@/components/home/poster/paint";
import { recogniseEnabled, recogniseStrokes } from "@/components/home/poster/recognise";
import { sharePoster, whatsappHref } from "@/components/home/poster/share";
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

type Family = "write" | "add" | "draw" | null;

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
  const objectsRef = useRef<PosterObj[]>([]);
  const draftRef = useRef<PosterObj | null>(null);
  const dragRef = useRef<{ id: string; last: Pt; resize: boolean } | null>(null);
  const undoRef = useRef<PosterObj[][]>([]);
  const [tool, setTool] = useState<PosterToolId>("pencil");
  const [family, setFamily] = useState<Family>(null);
  const [color, setColor] = useState("#e23b2e");
  const [decision, setDecision] = useState("");
  const [frozen, setFrozen] = useState(false);
  const [resetAsk, setResetAsk] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [font, setFont] = useState<PosterFont>("Visual");
  const [textSize, setTextSize] = useState(28);
  const [align, setAlign] = useState<TextAlign>("left");
  const [shape, setShape] = useState<ShapeKind>("rect");
  const [shapeFill, setShapeFill] = useState(false);
  const [tray, setTray] = useState<"none" | "add" | "send">("none");
  const [hasWork, setHasWork] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [waHref, setWaHref] = useState(whatsappHref(""));
  const [preview, setPreview] = useState("");

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const wrap = wrapRef.current;
    const caption = frozen && decision.trim() ? decision.trim() : undefined;
    paint(ctx, objectsRef.current, draftRef.current, wrap?.clientWidth ?? 0, wrap?.clientHeight ?? 0, {
      selectedId: frozen ? null : selectedId,
      chrome: !frozen,
      caption,
    });
  }, [decision, frozen, selectedId]);

  const resize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
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
    hydrateWorkspace();
    objectsRef.current = workspace.poster.objects.filter((o) => o.id !== "decision");
    setTool(workspace.poster.tool);
    setColor(workspace.poster.color);
    setDecision(workspace.poster.decision);
    setFrozen(false);
    setFont(workspace.poster.font);
    setTextSize(workspace.poster.textSize);
    setAlign(workspace.poster.align);
    setShape(workspace.poster.shape);
    setShapeFill(workspace.poster.shapeFill);
    setFamily(null);
    setHasWork(objectsRef.current.length > 0);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  useEffect(() => {
    if (!hidden) resize();
  }, [hidden, resize]);

  useEffect(() => {
    redraw();
  }, [redraw, preview]);

  function snapshot() {
    undoRef.current = undoRef.current.concat([objectsRef.current.map((o) => structuredClone(o))]).slice(-40);
  }

  function remember() {
    commitPoster({
      objects: objectsRef.current,
      decision,
      color,
      frozen: false,
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
    setEditingId(obj.id);
    setSelectedId(obj.id);
    setFont(obj.font);
    setTextSize(obj.size);
    setAlign(obj.align);
    setFamily("write");
    setTool("text");
  }

  function applyText(id: string, text: string) {
    objectsRef.current = objectsRef.current.map((o) =>
      o.id === id && o.kind === "text" ? { ...o, text } : o
    );
    remember();
    redraw();
  }

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
    if (frozen || dormant) return;
    if (editingId) setEditingId(null);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* optional */
    }
    const p = pos(event);
    const found = [...objectsRef.current].reverse().find((o) => hit(o, p));
    if (found) {
      if (family === "write" && found.kind === "text") {
        startEdit(found);
        return;
      }
      selectObject(found, p);
      return;
    }
    setSelectedId(null);
    if (!family) return;
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
      remember();
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
    if (frozen || dormant) return;
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
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    if (frozen || dormant) return;
    const file = event.dataTransfer.files[0];
    if (file) void addImageFile(file, pos(event));
  }

  function openSend() {
    setTray(tray === "send" ? "none" : "send");
    setFamily(null);
    setEmailOpen(true);
  }

  function downloadPoster() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hbw-decision.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function onWhatsApp() {
    const canvas = canvasRef.current;
    if (!canvas) {
      window.open(whatsappHref(decision), "_blank", "noreferrer");
      return;
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      window.open(whatsappHref(decision), "_blank", "noreferrer");
      return;
    }
    const result = await sharePoster({ blob, decision });
    if (result.kind === "hosted") {
      const href = whatsappHref(decision, result.url);
      setWaHref(href);
      setShareNote("");
      window.open(href, "_blank", "noreferrer");
      return;
    }
    setShareNote(result.note);
    const href = whatsappHref(decision);
    setWaHref(href);
    window.open(href, "_blank", "noreferrer");
  }

  async function onEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const canvas = canvasRef.current;
    const payload = canvas ? canvas.toDataURL("image/png") : "";
    setEmailStatus("Sending…");
    try {
      const res = await fetch("/api/hbw/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          name: String(form.get("name") || ""),
          decision,
          poster: payload,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      setEmailStatus(data.ok ? "Sent." : data.reason || "Email sending is disabled until a provider is configured.");
    } catch {
      setEmailStatus("Email sending is disabled until a provider is configured.");
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
    setTool("pencil");
    setFamily(null);
    setSelectedId(null);
    setEditingId(null);
    setResetAsk(false);
    setEmailOpen(false);
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
      setShareNote("Recognition is scaffolded and not configured.");
    }
  }

  function setCurrentTool(next: PosterToolId) {
    setTool(next);
    commitPoster({ tool: next });
  }

  function chooseFamily(next: Family) {
    if (next === family && next !== "add") {
      setFamily(null);
      setTray("none");
      return;
    }
    setFamily(next);
    if (next === "write") {
      setCurrentTool("text");
      setTray("none");
    } else if (next === "draw") {
      setCurrentTool(tool === "marker" ? "marker" : "pencil");
      setTray("none");
    } else if (next === "add") {
      setTray(tray === "add" ? "none" : "add");
      if (tray === "add") setFamily(null);
    }
  }

  function patchSelectedText(partial: Partial<TextObject>) {
    if (!selectedId) return;
    objectsRef.current = objectsRef.current.map((o) =>
      o.id === selectedId && o.kind === "text" ? { ...o, ...partial } : o
    );
    remember();
    redraw();
  }

  function cycleColor() {
    const i = PALETTE.indexOf(color as (typeof PALETTE)[number]);
    const next = PALETTE[(i + 1) % PALETTE.length];
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
    setFamily(null);
    setTray("none");
    setSelectedId(null);
    setEditingId(null);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (frozen || dormant) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if (event.key === "Escape") {
        toNeutral();
        return;
      }
      if (editingId) return;
      if ((event.key === "Backspace" || event.key === "Delete") && selectedId) {
        event.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
      className={`hbw-poster-field${family ? ` is-${family}` : " is-idle"}${
        dormant ? " is-dormant" : ""
      }${hidden ? " is-hidden" : ""}`}
      data-hbw-family={family || "idle"}
      data-hbw-context={textActive ? "text" : selectedStroke ? "stroke" : selectedImage ? "image" : "none"}
      aria-hidden={hidden ? true : undefined}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(event) => {
          const found = [...objectsRef.current].reverse().find((o) => o.kind === "text" && hit(o, pos(event)));
          if (found && found.kind === "text") startEdit(found);
        }}
      />
      {editing ? (
        <textarea
          className="hbw-poster-edit"
          autoFocus
          value={editing.text}
          style={{
            left: editing.x,
            top: editing.y,
            width: editing.w,
            minHeight: editing.h,
            color: editing.color,
            fontFamily: `${editing.font}, Geist, sans-serif`,
            fontSize: editing.size,
            textAlign: editing.align,
          }}
          onChange={(event) => applyText(editing.id, event.target.value)}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text/plain");
            if (!text) return;
            event.preventDefault();
            const node = event.currentTarget;
            const start = node.selectionStart;
            const end = node.selectionEnd;
            applyText(editing.id, editing.text.slice(0, start) + text + editing.text.slice(end));
          }}
          onBlur={() => setEditingId(null)}
          aria-label="Edit text"
        />
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        capture="environment"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void addImageFile(file);
          event.currentTarget.value = "";
        }}
      />
      <IconContext.Provider value={{ weight: "light", size: 18, color: "currentColor" }}>
          <div className="hbw-poster-toolbar" role="toolbar" aria-label="Make">
            <div className="hbw-poster-toolbar__primary">
              <button
                type="button"
                className={`hbw-poster-tool${family === "write" ? " is-current" : ""}`}
                aria-label="Write"
                aria-pressed={family === "write"}
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
                onClick={() => chooseFamily("add")}
              >
                <Plus />
                <span>Add</span>
              </button>
            </div>
            <input
              className="hbw-poster-input"
              value={decision}
              placeholder="What are you trying to solve?"
              aria-label="What are you trying to solve?"
              onChange={(e) => {
                const value = e.target.value;
                setDecision(value);
                commitPoster({ objects: objectsRef.current, decision: value });
              }}
            />
            <button
              type="button"
              className={`hbw-poster-send-open${tray === "send" ? " is-current" : ""}`}
              aria-label="Send"
              aria-pressed={tray === "send"}
              onClick={openSend}
            >
              <PaperPlaneTilt />
              <span>Send</span>
            </button>
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
                <button type="button" className="hbw-poster-swatch" style={{ background: color }} aria-label="Stroke colour" onClick={cycleColor} />
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
                <button type="button" className="hbw-poster-swatch" style={{ background: color }} aria-label="Colour" onClick={cycleColor} />
                <button type="button" className="hbw-poster-tool" aria-label="Delete" onClick={deleteSelected}>
                  <Trash />
                </button>
              </div>
            ) : null}
            {selectedStroke ? (
              <div className="hbw-poster-toolbar__context" data-stage="stroke">
                <button type="button" className="hbw-poster-swatch" style={{ background: color }} aria-label="Colour" onClick={cycleColor} />
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
            {tray === "send" ? (
              <div className="hbw-poster-toolbar__tray hbw-poster-send" data-stage="send">
                <form className="hbw-poster-email" onSubmit={(event) => void onEmail(event)}>
                  <input name="email" type="email" required placeholder="Email" aria-label="Email" />
                  <input name="name" type="text" placeholder="Name (optional)" aria-label="Name" />
                  <button type="submit">Email</button>
                </form>
                <button type="button" onClick={() => void onWhatsApp()}>
                  WhatsApp
                </button>
                <button type="button" onClick={downloadPoster}>
                  Download
                </button>
                <span className="hbw-poster-note">
                  {shareNote ||
                    "WhatsApp opens with the decision text. The poster image downloads separately — browsers cannot attach it."}
                  {emailStatus ? ` ${emailStatus}` : ""}
                </span>
                <a href={waHref} hidden>
                  WhatsApp
                </a>
              </div>
            ) : null}
          </div>
      </IconContext.Provider>
    </div>
  );
}
