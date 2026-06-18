import { beforeEach, describe, expect, it } from "vitest";

import {
  hasPendingToolJob,
  setPendingToolJob,
  takePendingToolJob,
  type PendingToolJob,
} from "../lib/tools/pending-tool-job";
import {
  buildToolPrompt,
  CHARACTER_SHEET_PROMPT,
  getTool,
  TOOLS,
} from "../lib/tools/registry";

describe("tools registry", () => {
  it("ships the character-sheet tool", () => {
    const tool = getTool("character-sheet");
    expect(tool).toBeDefined();
    expect(tool?.nameKey).toBe("tools.characterSheet.name");
    expect(tool?.defaultPrompt).toBe(CHARACTER_SHEET_PROMPT);
  });

  it("character-sheet requires at least one reference image", () => {
    const tool = getTool("character-sheet");
    expect(tool?.minImages).toBe(1);
    expect(tool?.maxImages).toBeGreaterThanOrEqual(tool?.minImages ?? 0);
    expect(tool?.allowSupplement).toBe(true);
  });

  it("default prompt covers the three-view character-sheet structure", () => {
    expect(CHARACTER_SHEET_PROMPT).toContain("三视图");
    expect(CHARACTER_SHEET_PROMPT).toContain("正面 + 侧面 + 背面");
    expect(CHARACTER_SHEET_PROMPT).toContain("配色板");
    expect(CHARACTER_SHEET_PROMPT).toContain("背景为白色");
  });

  it("every tool id is unique", () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getTool returns undefined for unknown id", () => {
    expect(getTool("nope")).toBeUndefined();
  });
});

describe("buildToolPrompt", () => {
  const tool = getTool("character-sheet")!;

  it("uses only the default prompt when no supplement is given", () => {
    expect(buildToolPrompt(tool)).toBe(tool.defaultPrompt);
    expect(buildToolPrompt(tool, "")).toBe(tool.defaultPrompt);
    expect(buildToolPrompt(tool, "   ")).toBe(tool.defaultPrompt);
  });

  it("appends the trimmed supplement after the default prompt", () => {
    const result = buildToolPrompt(tool, "  穿红色卫衣  ");
    expect(result).toBe(`${tool.defaultPrompt}\n\n穿红色卫衣`);
  });

  it("ignores supplement when the tool disallows it", () => {
    const noSupplement = { ...tool, allowSupplement: false };
    expect(buildToolPrompt(noSupplement, "ignored")).toBe(tool.defaultPrompt);
  });
});

describe("pending tool job", () => {
  const job: PendingToolJob = {
    toolId: "character-sheet",
    prompt: "p",
    files: [],
    params: { size: "1024x1024", quality: "auto", n: 1 },
  };

  beforeEach(() => {
    // drain any leftover jobs between tests
    takePendingToolJob("s1");
    takePendingToolJob("s2");
  });

  it("stores and retrieves a job by session id", () => {
    setPendingToolJob("s1", job);
    expect(hasPendingToolJob("s1")).toBe(true);
    expect(takePendingToolJob("s1")).toEqual(job);
  });

  it("take is one-shot — a job can only be consumed once", () => {
    setPendingToolJob("s2", job);
    expect(takePendingToolJob("s2")).toEqual(job);
    expect(takePendingToolJob("s2")).toBeUndefined();
    expect(hasPendingToolJob("s2")).toBe(false);
  });
});
