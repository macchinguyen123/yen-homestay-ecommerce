"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import "./tilted-grid-hero.css";

export type TiltedGridImage = {
  src: string;
  alt?: string;
};

export type TiltedGridHeroProps = {
  images: TiltedGridImage[];
  speed?: number;
  gap?: number;
  fade?: number;
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 30,
  gap = 16,
  fade = 12,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  // Ensure safe array of images
  const safeImages = React.useMemo(() => {
    return Array.isArray(images) && images.length > 0 ? images : [];
  }, [images]);

  // Duplicate items so track loops seamlessly (-50%)
  const duplicatedList = React.useMemo(() => {
    if (safeImages.length === 0) return [];
    let list = [...safeImages];
    while (list.length < 14) {
      list = [...list, ...safeImages];
    }
    return [...list, ...list];
  }, [safeImages]);

  // Pre-cache images
  React.useEffect(() => {
    for (const item of safeImages) {
      if (item?.src) {
        const img = new Image();
        img.src = item.src;
      }
    }
  }, [safeImages]);

  const mask = `linear-gradient(90deg, transparent 0%, #000 ${fade}%, #000 ${100 - fade}%, transparent 100%)`;

  return (
    <div
      className={cn("tgh-wrapper relative overflow-hidden", className)}
      {...props}
    >
      {/* 3D Panoramic Gliding Ribbon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 tgh-perspective-stage"
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <div
          className="tgh-glide-track"
          style={{
            animationDuration: `${speed}s`,
          }}
        >
          {duplicatedList.map((item, idx) => (
            <div
              key={idx}
              className="tgh-panoramic-card"
              style={{
                marginRight: `${gap}px`,
              }}
            >
              <img
                src={item.src}
                alt={item.alt || ""}
                loading="eager"
                decoding="async"
                draggable={false}
                className="tgh-card-img"
              />
            </div>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}

export default TiltedGridHero;
