"use client";

import { CopyOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import type { ImageResult } from "@super-image/utils";
import { Button, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

import { getImage } from "@/lib/db";

interface ImageCardProps {
  image: ImageResult;
  onClick?: () => void;
  onEdit?: () => void;
}

export function ImageCard({ image, onClick, onEdit }: ImageCardProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(image.localBlobUrl ?? null);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const recoveredRef = useRef(false);

  useEffect(() => {
    // 内存中的 localBlobUrl 直接使用;若失效则交给 <img> 的 onError 兜底。
    // 依赖 image.localBlobUrl 而非 blobUrl，避免 setBlobUrl 触发 effect 重跑后
    // cleanup 误 revoke 掉刚创建的 URL。
    if (image.localBlobUrl) return;
    let url: string | null = null;
    let cancelled = false;
    async function loadBlob() {
      const stored = await getImage(image.id);
      if (stored && !cancelled) {
        url = URL.createObjectURL(stored.blob);
        setBlobUrl(url);
      }
    }
    loadBlob();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [image.id, image.localBlobUrl]);

  // 持久化恢复的 localBlobUrl 在页面刷新后已失效，加载失败时从 IndexedDB 重新生成。
  const handleError = useCallback(async () => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;
    const stored = await getImage(image.id);
    if (stored) {
      setLoaded(false);
      setBlobUrl(URL.createObjectURL(stored.blob));
    }
  }, [image.id]);

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
      await navigator.clipboard.write([new ClipboardItem({ "image/png": stored.blob })]);
    } catch { /* Clipboard API may not be available */ }
  }, [image.id]);

  return (
    <div className="image-card-wrap" style={{ position: "relative", overflow: "hidden", borderRadius: 8, maxWidth: 360 }}>
      {blobUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- blob URL */
        <img
          ref={imgRef}
          src={blobUrl}
          alt="Generated image"
          onClick={onClick}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          style={{
            width: "100%",
            borderRadius: 8,
            objectFit: "cover",
            cursor: "pointer",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s",
          }}
          loading="lazy"
        />
      ) : (
        <div style={{ aspectRatio: "1", width: "100%", borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spin />
        </div>
      )}

      <div
        className="image-card-actions"
        style={{
          position: "absolute",
          inset: "auto 0 0 0",
          display: "flex",
          justifyContent: "flex-end",
          gap: 4,
          padding: 8,
          background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
        }}
      >
        {onEdit && (
          <Button
            size="small"
            shape="circle"
            icon={<EditOutlined style={{ color: "#fff", fontSize: 12 }} />}
            onClick={onEdit}
            style={{ background: "rgba(255,255,255,0.2)", border: "none" }}
          />
        )}
        <Button
          size="small"
          shape="circle"
          icon={<DownloadOutlined style={{ color: "#fff", fontSize: 12 }} />}
          onClick={handleDownload}
          style={{ background: "rgba(255,255,255,0.2)", border: "none" }}
        />
        <Button
          size="small"
          shape="circle"
          icon={<CopyOutlined style={{ color: "#fff", fontSize: 12 }} />}
          onClick={handleCopy}
          style={{ background: "rgba(255,255,255,0.2)", border: "none" }}
        />
      </div>
    </div>
  );
}
