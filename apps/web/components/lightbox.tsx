"use client";

import {
  CloseOutlined,
  CopyOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { ImageResult } from "@super-image/utils";
import { Button, Spin } from "antd";
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
  const [dimensions, setDimensions] = useState("");

  const current = images[index];

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
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [current]);

  useEffect(() => {
    if (!blobUrl) return;
    const img = new Image();
    img.onload = () => setDimensions(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.src = blobUrl;
  }, [blobUrl]);

  const handlePrev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const handleNext = useCallback(() => setIndex((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

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
      await navigator.clipboard.write([new ClipboardItem({ "image/png": stored.blob })]);
    } catch { /* noop */ }
  }, [current]);

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
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 200ms ease",
      }}
    >
      <Button
        shape="circle"
        icon={<CloseOutlined />}
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}
      />

      {images.length > 1 && (
        <>
          <Button
            shape="circle"
            icon={<LeftOutlined />}
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            style={{ position: "absolute", left: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}
            size="large"
          />
          <Button
            shape="circle"
            icon={<RightOutlined />}
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            style={{ position: "absolute", right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}
            size="large"
          />
        </>
      )}

      <div style={{ maxHeight: "90vh", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
        {blobUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- blob URL */
          <img src={blobUrl} alt="Full size preview" style={{ maxHeight: "85vh", maxWidth: "90vw", objectFit: "contain", borderRadius: 8 }} />
        ) : (
          <div style={{ width: 256, height: 256, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spin size="large" />
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderRadius: 24,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          padding: "8px 24px",
        }}
      >
        {dimensions && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{dimensions}</span>}
        {images.length > 1 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{index + 1} / {images.length}</span>}
        <Button
          type="text"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          style={{ color: "#fff" }}
          size="small"
        />
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          style={{ color: "#fff" }}
          size="small"
        />
      </div>
    </div>
  );
}
