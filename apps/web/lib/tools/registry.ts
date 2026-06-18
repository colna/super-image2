import type { ToolDef } from "./tool-types";

/**
 * 「生成角色图」默认提示词。
 * 提取参考图片中的人物形象，输出标准化的角色三视图设定图。
 */
export const CHARACTER_SHEET_PROMPT =
  "提取图片中人物形象。人物形象提示词：（三视图） " +
  "1.主视觉区 (上方)以 \"正面 + 侧面 + 背面\" 三个核心视角为主体，直观呈现角色的整体身形、服饰搭配和标志性特征，是制作人员对人物 \"整体造型\" 的参考基础。 " +
  "2.补充信息区 (左侧)拆分出 \"面部特写\" 和 \"配色板\"(明确毛发、服饰的色值)，补充主视角没覆盖的细节与色彩标准。 " +
  "3.局部细节区 (底部)用小模块单独展示关键部件的设计 (配饰、点缀、关键身份识别元素)，把主视角里的 \"模糊细节\" 拆分为精准的制作参考，方便导演确认。 " +
  "4.全身照比例照 (右侧)使用黄金比例参考物和人物身高形成对比。 " +
  "5.背景为白色，最高品质细节丰富。";

/** 工具注册表：新增工具往此数组追加即可。 */
export const TOOLS: ToolDef[] = [
  {
    id: "character-sheet",
    nameKey: "tools.characterSheet.name",
    descKey: "tools.characterSheet.desc",
    icon: "UserOutlined",
    defaultPrompt: CHARACTER_SHEET_PROMPT,
    allowSupplement: true,
    minImages: 1,
    maxImages: 5,
  },
];

export function getTool(id: string): ToolDef | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

/**
 * 组合最终提示词：默认 prompt 为主体，用户补充内容追加在后。
 * 补充为空时只用默认 prompt，避免产生多余空行。
 */
export function buildToolPrompt(tool: ToolDef, supplement?: string): string {
  const extra = supplement?.trim();
  if (tool.allowSupplement && extra) {
    return `${tool.defaultPrompt}\n\n${extra}`;
  }
  return tool.defaultPrompt;
}
