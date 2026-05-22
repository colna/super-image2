"use client";

import { CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCallback, useEffect, useState } from "react";

/**
 * Simple click-to-preview for any image with a blob/object URL.
 * Wraps children and shows a fullscreen overlay on click.
 */
interface ImagePreviewProps {
  src: string;
  alt?: string;
  children: React.ReactNode;
}

export function ImagePreview({ src, alt, children }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  }, []);

  return (
    <>
      <div onClick={handleOpen} style={{ cursor: "pointer" }}>
        {children}
      </div>
      {open && (
        <div
          onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
            style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt ?? "Preview"}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: 8 }}
          />
        </div>
      )}
    </>
  );
}
