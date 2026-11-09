"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-col gap-2 lg:sticky lg:top-20 lg:self-start">
      <div className="relative aspect-[4/5] max-h-[72dvh] overflow-hidden bg-[#f3f1ed]">
        {images[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[i]} alt={name} className="absolute inset-0 size-full object-contain p-4 mix-blend-multiply" />
        ) : (
          <div className="grid size-full place-items-center font-mono text-xs text-black/40 uppercase">no photo</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, k) => (
            <button
              key={src}
              onClick={() => setI(k)}
              onMouseEnter={() => setI(k)}
              className={cn("size-20 overflow-hidden border-2 bg-[#f3f1ed]", k === i ? "border-signal" : "border-transparent opacity-70 hover:opacity-100")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-contain mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
