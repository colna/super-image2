/**
 * 工具栏工具的数据模型。
 *
 * 工具是「预置 prompt + 表单」的封装：用户只需上传图片、补充少量提示词，
 * 即可复用底层图片生成链路（generateWithRefs）产出图片。新增工具时只需
 * 往 registry 追加一条 ToolDef，UI 与生成逻辑无需改动。
 */
export interface ToolDef {
  /** 唯一标识，用于路由与待执行任务匹配 */
  id: string;
  /** i18n key：工具名称 */
  nameKey: string;
  /** i18n key：工具简介 */
  descKey: string;
  /** Ant Design 图标名（在 toolbar 中按名映射，避免在数据层耦合 React 节点） */
  icon: string;
  /** 预置的默认提示词，作为生成的主体内容 */
  defaultPrompt: string;
  /** 是否允许用户追加补充提示词 */
  allowSupplement: boolean;
  /** 参考图片数量约束 */
  minImages: number;
  maxImages: number;
}
