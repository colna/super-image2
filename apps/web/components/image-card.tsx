"use client";

import type { ImageResult } from "@super-image/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { getImage } from "@/lib/db";

interface ImageCardProps {
  image: ImageResult;
  onClick?: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(image.localBlobUrl ?? null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load blob from IndexedDB and create Object URL
  useEffect(() => {
    if (blobUrl) return;
    let url: string | null = null;

    async function loadBlob() {
      const stored = await getImage(image.id);
      if (stored) {
        url = URL.createObjectURL(stored.blob);
        setBlobUrl(url);
      }
    }
    loadBlob();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image.id, blobUrl]);

  const handleDownload = useCallback(async () => {
    const stored = await getImage(image.id);
    if (!stored) return;
    const url = URL.createObjectURL(stored.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superimage-${image.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [image.id]);

  const handleCopy = useCallback(async () => {
    const stored = await getImage(image.id);
    if (!stored) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": stored.blob }),
      ]);
    } catch {
      // Fallback: clipboard API may not be available
    }
  }, [image.id]);

  return (
    <div className="group relative overflow-hidden rounded-card">
      {blobUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- blob URL, not optimizable */
        <img
          ref={imgRef}
          src={blobUrl}
          alt="Generated image"
          className="w-full cursor-pointer rounded-card object-cover opacity-0 transition-opacity duration-300"
          loading="lazy"
          onClick={onClick}
          onLoad={() => imgRef.current?.classList.replace("opacity-0", "opacity-100")}
        />
      ) : (
        <div className="aspect-square w-full animate-pulse rounded-card bg-border/50" />
      )}

      {/* Hover actions */}
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleDownload}
          className="rounded-card bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-white/30"
          title="Download"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7.5M3.5 7L7 10.5 10.5 7M2 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={handleCopy}
          className="rounded-card bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-white/30"
          title="Copy to clipboard"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 4V2.5A1.5 1.5 0 008.5 1h-6A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

    </div>
  );
}
