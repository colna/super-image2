"use client";

import { useEffect } from "react";

interface HotkeyMap {
  [key: string]: () => void;
}

/**
 * Global keyboard shortcut handler.
 * Keys use format: "meta+k", "meta+,", "meta+\\", "Escape"
 */
export function useHotkeys(hotkeys: HotkeyMap) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push("meta");
      const key = e.key;

      if (parts.length > 0) {
        const combo = `${parts.join("+")}+${key.toLowerCase()}`;
        if (hotkeys[combo]) {
          e.preventDefault();
          hotkeys[combo]();
          return;
        }
      }

      if (hotkeys[key]) {
        hotkeys[key]();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hotkeys]);
}
