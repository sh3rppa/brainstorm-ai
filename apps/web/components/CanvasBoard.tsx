"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Icon, type IconName } from "@/components/icons";

type CanvasTool = "pen" | "line" | "rectangle" | "eraser";

type Point = {
  x: number;
  y: number;
};

type CanvasBoardProps = {
  initialCanvasData: string | null;
  onCanvasDataChange: (value: string | null) => void;
};

const canvasColors = ["#181815", "#7164f4", "#ff8e51", "#89b93f"] as const;
const tools: Array<{ tool: CanvasTool; icon: IconName; label: string }> = [
  { tool: "pen", icon: "pen", label: "Pen" },
  { tool: "line", icon: "line", label: "Line" },
  { tool: "rectangle", icon: "rectangle", label: "Rectangle" },
  { tool: "eraser", icon: "eraser", label: "Eraser" },
];

export function CanvasBoard({ initialCanvasData, onCanvasDataChange }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const startRef = useRef<Point | null>(null);
  const baseRef = useRef<ImageData | null>(null);
  const imageRef = useRef<string | null>(initialCanvasData);
  const [tool, setTool] = useState<CanvasTool>("pen");
  const [color, setColor] = useState<(typeof canvasColors)[number]>("#181815");
  const [hasMarks, setHasMarks] = useState(Boolean(initialCanvasData));

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resizeCanvas = (): void => {
      const context = canvas.getContext("2d");
      if (!context) return;
      const ratio = window.devicePixelRatio || 1;
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      const savedImage = imageRef.current;

      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";

      if (savedImage) drawImage(context, savedImage, width, height);
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(wrap);
    resizeCanvas();

    return () => observer.disconnect();
  }, []);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function prepareStroke(context: CanvasRenderingContext2D): void {
    context.lineWidth = tool === "eraser" ? 22 : 3;
    context.strokeStyle = tool === "eraser" ? "#fbfaf6" : color;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>): void {
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    startRef.current = pointFromEvent(event);
    baseRef.current = context.getImageData(0, 0, canvas.width, canvas.height);
    prepareStroke(context);

    if (tool === "pen" || tool === "eraser") {
      context.beginPath();
      context.moveTo(startRef.current.x, startRef.current.y);
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>): void {
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    const start = startRef.current;
    const base = baseRef.current;
    if (!context || !drawingRef.current || !start) return;

    const current = pointFromEvent(event);
    prepareStroke(context);

    if (tool === "pen" || tool === "eraser") {
      context.lineTo(current.x, current.y);
      context.stroke();
      return;
    }

    if (base) context.putImageData(base, 0, 0);
    context.beginPath();
    if (tool === "line") {
      context.moveTo(start.x, start.y);
      context.lineTo(current.x, current.y);
    } else {
      context.rect(start.x, start.y, current.x - start.x, current.y - start.y);
    }
    context.stroke();
  }

  function finishStroke(event: ReactPointerEvent<HTMLCanvasElement>): void {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    startRef.current = null;
    baseRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const image = event.currentTarget.toDataURL("image/png");
    imageRef.current = image;
    setHasMarks(true);
    onCanvasDataChange(image);
  }

  function clearCanvas(): void {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    imageRef.current = null;
    setHasMarks(false);
    onCanvasDataChange(null);
  }

  return (
    <div className="canvas-panel">
      <div className="canvas-wrap" ref={wrapRef}>
        <canvas
          aria-label="Free drawing canvas"
          id="brain-canvas"
          onPointerCancel={finishStroke}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          ref={canvasRef}
          tabIndex={0}
        />
        <div className={`canvas-hint ${hasMarks ? "hidden" : ""}`}>
          <span>
            Draw the thought before it disappears.
            <br />
            <small>Use a pen, shape, or color below.</small>
          </span>
        </div>
      </div>
      <div aria-label="Canvas tools" className="toolbar">
        {tools.map((item) => (
          <button
            aria-label={item.label}
            className={`tool-button ${tool === item.tool ? "active" : ""}`}
            key={item.tool}
            onClick={() => setTool(item.tool)}
            title={item.label}
            type="button"
          >
            <Icon name={item.icon} />
          </button>
        ))}
        <span className="toolbar-separator" />
        {canvasColors.map((item) => (
          <button
            aria-label={`Use ${item}`}
            className={`color-button ${color === item ? "active" : ""}`}
            key={item}
            onClick={() => setColor(item)}
            style={{ background: item }}
            type="button"
          />
        ))}
        <span className="toolbar-separator" />
        <button aria-label="Clear canvas" className="tool-button" onClick={clearCanvas} title="Clear canvas" type="button">
          <Icon name="refresh" />
        </button>
      </div>
    </div>
  );
}

function drawImage(context: CanvasRenderingContext2D, source: string, width: number, height: number): void {
  const image = new Image();
  image.onload = () => context.drawImage(image, 0, 0, width, height);
  image.src = source;
}

