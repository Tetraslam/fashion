"use client";

import { useState, type ReactNode } from "react";
import { Dithering } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";

// Drop target with a dithered shader backdrop that wakes up on hover/drag-over.
// Same feel as the delve-onsite upload zone, retuned for the light theme.
export function ShaderZone({
  children,
  onDropData,
  accept = () => true,
  active: forced,
  tint = "#aab3ff",
  className,
  onClick,
}: {
  children: ReactNode;
  onDropData?: (dt: DataTransfer) => void;
  accept?: (dt: DataTransfer) => boolean;
  active?: boolean;
  tint?: string;
  className?: string;
  onClick?: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(false);
  const active = forced || drag || hover;

  return (
    <div
      className={cn(
        "relative overflow-hidden border transition-all duration-500 ease-out",
        active ? "border-brand/40 shadow-[0_0_48px_-14px_rgba(29,51,255,0.45)]" : "border-border",
        className,
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragEnter={(e) => {
        if (!accept(e.dataTransfer)) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragOver={(e) => {
        if (!accept(e.dataTransfer)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onDropData?.(e.dataTransfer);
      }}
      onClick={onClick}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: active ? "scale(1.05)" : "scale(1)" }}
      >
        <Dithering
          colorBack="#f6f6f4"
          colorFront={active ? tint : "#e7e7e3"}
          shape="warp"
          type="8x8"
          size={2.5}
          speed={active ? 0.6 : 0.15}
          scale={1}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="relative z-10 size-full">{children}</div>
    </div>
  );
}
