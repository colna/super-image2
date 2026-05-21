"use client";

import type { ImageResult } from "@super-image/utils";
import { useCallback, useEffect, useState } from "react";

import { getImage } from "@/lib/db";

interface LightboxProps {
  images: ImageResult[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<string>("");

  const current = images[index];

  // Load image blob
  useEffect(() => {
    if (!current) return;
    let url: string | null = null;

    async function loadBlob() {
      const stored = await getImage(current.id);
      if (stored) {
        url = URL.createObjectURL(stored.blob);
        setBlobUrl(url);
      }
    }
    loadBlob();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [current]);

  // Get image dimensions
  useEffect(() => {
    if (!blobUrl) return;
    const img = new Image();
    img.onload = () => setDimensions(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.src = blobUrl;
  }, [blobUrl]);

  const handlePrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  const handleDownload = useCallback(async () => {
    if (!current) return;
    const stored = await getImage(current.id);
    if (!stored) return;
    const url = URL.createObjectURL(stored.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superimage-${current.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [current]);

  const handleCopy = useCallback(async () => {
    if (!current) return;
    const stored = await getImage(current.id);
    if (!stored) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": stored.blob }),
      ]);
    } catch {
      // Clipboard API may not be available
    }
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Image */}
      <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {blobUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- blob URL */
          <img
            src={blobUrl}
            alt="Full size preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />
        ) : (
          <div className="h-64 w-64 animate-pulse rounded-lg bg-white/10" />
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-white/10 px-6 py-2.5 backdrop-blur-sm">
        {dimensions && (
          <span className="text-xs text-white/70">{dimensions}</span>
        )}
        {images.length > 1 && (
          <span className="text-xs text-white/70">
            {index + 1} / {images.length}
          </span>
        )}
        <button
          onClick={handleDownload}
          className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors"
          title="Download PNG"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8.5M4 8l4 3.5L12 8M2 13.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={handleCopy}
          className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors"
          title="Copy PNG"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4.5" y="4.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M11.5 4.5V3A1.5 1.5 0 0010 1.5H3A1.5 1.5 0 001.5 3v7A1.5 1.5 0 003 11.5h1.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
