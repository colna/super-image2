import type {
  Attachment,
  GenerateParams,
  ImageResult,
  Message,
} from "@super-image/utils";
import { create } from "zustand";

import {
  addMessage as dbAddMessage,
  getImage,
  getMessagesBySession,
  saveAttachment,
  saveImage,
  updateMessage as dbUpdateMessage,
} from "@/lib/db";
import {
  requestEdit,
  requestGenerate,
  requestGenerateWithRefs,
} from "@/lib/generation-client";
import { useSettingsStore } from "@/stores/settings-store";

/** 生成参数以 UI 传入为准，缺失模型时回落到服务商上次选择 */
function resolveParams(
  params: GenerateParams,
  fallback: GenerateParams,
): GenerateParams {
  return {
    ...fallback,
    ...params,
    model: params.model || fallback.model,
  };
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  /** Per-session generating flags so concurrent sessions don't block each other */
  generatingSessions: Record<string, boolean>;
  /** Per-session abort controllers */
  abortControllers: Record<string, AbortController>;

  // Actions
  loadMessages: (sessionId: string) => Promise<void>;
  addMessage: (message: Message) => Promise<void>;
  updateMessage: (id: string, changes: Partial<Message>) => Promise<void>;
  isGenerating: (sessionId: string) => boolean;
  setGenerating: (sessionId: string, generating: boolean) => void;
  setAbortController: (sessionId: string, controller: AbortController | null) => void;
  cancelGeneration: (sessionId: string) => void;
  clearMessages: () => void;
  sendGenerate: (
    sessionId: string,
    prompt: string,
    params: GenerateParams,
  ) => Promise<void>;
  sendEdit: (
    sessionId: string,
    prompt: string,
    sourceImageId: string,
    params: GenerateParams,
  ) => Promise<void>;
  sendGenerateWithRefs: (
    sessionId: string,
    prompt: string,
    attachmentFiles: File[],
    params: GenerateParams,
  ) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  loading: false,
  generatingSessions: {},
  abortControllers: {},

  loadMessages: async (sessionId) => {
    set({ messages: [], loading: true });
    const messages = await getMessagesBySession(sessionId);
    set({ messages, loading: false });
  },

  addMessage: async (message) => {
    await dbAddMessage(message);
    set((state) => ({ messages: [...state.messages, message] }));
  },

  updateMessage: async (id, changes) => {
    // localBlobUrl 是仅在当前页面会话有效的临时 object URL，刷新后即失效，
    // 不能持久化到 IndexedDB（否则重新加载时拿到失效 URL 导致图片无法显示）。
    // 图片本体已存于 imageStore，重新加载时按 id 重建 URL 即可。
    const persistedChanges: Partial<Message> = changes.images
      ? {
          ...changes,
          images: changes.images.map((img) => ({
            id: img.id,
            revisedPrompt: img.revisedPrompt,
          })),
        }
      : changes;
    await dbUpdateMessage(id, persistedChanges);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...changes } : m,
      ),
    }));
  },

  isGenerating: (sessionId) => !!get().generatingSessions[sessionId],

  setGenerating: (sessionId, generating) =>
    set((state) => ({
      generatingSessions: { ...state.generatingSessions, [sessionId]: generating },
    })),

  setAbortController: (sessionId, controller) =>
    set((state) => {
      if (controller) {
        return { abortControllers: { ...state.abortControllers, [sessionId]: controller } };
      }
      const { [sessionId]: _, ...rest } = state.abortControllers;
      return { abortControllers: rest };
    }),

  cancelGeneration: (sessionId) => {
    const { abortControllers } = get();
    const controller = abortControllers[sessionId];
    if (controller) {
      controller.abort();
      const { [sessionId]: _, ...restControllers } = abortControllers;
      set((state) => ({
        abortControllers: restControllers,
        generatingSessions: { ...state.generatingSessions, [sessionId]: false },
      }));
    }
  },

  clearMessages: () => set({ messages: [] }),

  sendGenerate: async (sessionId, prompt, params) => {
    const { addMessage, updateMessage, setGenerating, setAbortController } = get();
    const settings = useSettingsStore.getState();
    const config = settings.providers[settings.activeProviderId];

    if (!config) return;

    const resolved = resolveParams(params, config.defaultParams);

    // 1. Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sessionId,
      role: "user",
      type: "generate",
      content: prompt,
      createdAt: Date.now(),
      status: "done",
      params: resolved,
    };
    await addMessage(userMsg);

    // 2. Add pending AI message
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: aiMsgId,
      sessionId,
      role: "assistant",
      type: "generate",
      content: "",
      createdAt: Date.now(),
      status: "generating",
      params: resolved,
    };
    await addMessage(aiMsg);

    // 3. Call provider through the same-origin API route
    const controller = new AbortController();
    setAbortController(sessionId, controller);
    setGenerating(sessionId, true);

    try {
      const result = await requestGenerate(
        config,
        prompt,
        resolved,
        controller.signal,
      );

      // 4. Decode base64 → Blob → save to IndexedDB
      const images: ImageResult[] = [];
      for (const img of result.images) {
        const bytes = Uint8Array.from(atob(img.b64Json), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/png" });
        await saveImage(img.id, blob, aiMsgId);
        const localBlobUrl = URL.createObjectURL(blob);
        images.push({
          id: img.id,
          revisedPrompt: img.revisedPrompt,
          localBlobUrl,
        });
      }

      // 5. Update AI message to done
      await updateMessage(aiMsgId, {
        status: "done",
        images,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        await updateMessage(aiMsgId, {
          status: "error",
          content: "Generation cancelled",
        });
      } else {
        await updateMessage(aiMsgId, {
          status: "error",
          content: (err as Error).message ?? "Unknown error",
        });
      }
    } finally {
      setGenerating(sessionId, false);
      setAbortController(sessionId, null);
    }
  },

  sendEdit: async (sessionId, prompt, sourceImageId, params) => {
    const { addMessage, updateMessage, setGenerating, setAbortController } = get();
    const settings = useSettingsStore.getState();
    const config = settings.providers[settings.activeProviderId];

    if (!config) return;

    // 1. Load source image blob from IndexedDB
    const stored = await getImage(sourceImageId);
    if (!stored) return;

    const resolved = resolveParams(params, config.defaultParams);

    // 2. Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sessionId,
      role: "user",
      type: "edit",
      content: prompt,
      sourceImage: sourceImageId,
      createdAt: Date.now(),
      status: "done",
      params: resolved,
    };
    await addMessage(userMsg);

    // 3. Add pending AI message
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: aiMsgId,
      sessionId,
      role: "assistant",
      type: "edit",
      content: "",
      createdAt: Date.now(),
      status: "generating",
      params: resolved,
    };
    await addMessage(aiMsg);

    // 4. Call provider through the same-origin API route
    const controller = new AbortController();
    setAbortController(sessionId, controller);
    setGenerating(sessionId, true);

    try {
      const result = await requestEdit(
        config,
        prompt,
        stored.blob,
        resolved,
        controller.signal,
      );

      // 5. Decode base64 → Blob → save to IndexedDB
      const images: ImageResult[] = [];
      for (const img of result.images) {
        const bytes = Uint8Array.from(atob(img.b64Json), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/png" });
        await saveImage(img.id, blob, aiMsgId);
        const localBlobUrl = URL.createObjectURL(blob);
        images.push({
          id: img.id,
          revisedPrompt: img.revisedPrompt,
          localBlobUrl,
        });
      }

      // 6. Update AI message to done
      await updateMessage(aiMsgId, {
        status: "done",
        images,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        await updateMessage(aiMsgId, {
          status: "error",
          content: "Edit cancelled",
        });
      } else {
        await updateMessage(aiMsgId, {
          status: "error",
          content: (err as Error).message ?? "Unknown error",
        });
      }
    } finally {
      setGenerating(sessionId, false);
      setAbortController(sessionId, null);
    }
  },

  sendGenerateWithRefs: async (sessionId, prompt, attachmentFiles, params) => {
    const { addMessage, updateMessage, setGenerating, setAbortController } = get();
    const settings = useSettingsStore.getState();
    const config = settings.providers[settings.activeProviderId];

    if (!config) return;

    const resolved = resolveParams(params, config.defaultParams);

    // 1. Build attachments metadata + collect image files for the API
    const userMsgId = crypto.randomUUID();
    const attachments: Attachment[] = [];
    const referenceFiles: File[] = [];

    const textContents: string[] = [];

    for (const file of attachmentFiles) {
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      attachments.push({
        id,
        name: file.name,
        type: isImage ? "image" : "file",
        mimeType: file.type,
        size: file.size,
      });

      // Save to attachmentStore
      await saveAttachment(id, file, userMsgId, file.name, file.type);

      if (isImage) {
        // 服务端路由直接接收 File，避免前端再转 base64 多一次内存拷贝
        referenceFiles.push(file);
      } else if (isTextFile(file)) {
        // Read text-based files and append content to prompt
        const text = await file.text();
        textContents.push(`[${file.name}]\n${text}`);
      }
    }

    // 2. Add user message with attachments
    const userMsg: Message = {
      id: userMsgId,
      sessionId,
      role: "user",
      type: "generate",
      content: prompt,
      attachments,
      createdAt: Date.now(),
      status: "done",
      params: resolved,
    };
    await addMessage(userMsg);

    // 3. Add pending AI message
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: aiMsgId,
      sessionId,
      role: "assistant",
      type: "generate",
      content: "",
      createdAt: Date.now(),
      status: "generating",
      params: resolved,
    };
    await addMessage(aiMsg);

    // 4. Build enriched prompt (append text file contents)
    const enrichedPrompt = textContents.length > 0
      ? `${prompt}\n\n---\n${textContents.join("\n\n")}`
      : prompt;

    // 5. Call provider: images → edits, text-only → generations
    const controller = new AbortController();
    setAbortController(sessionId, controller);
    setGenerating(sessionId, true);

    try {
      const result = referenceFiles.length > 0
        ? await requestGenerateWithRefs(
            config,
            enrichedPrompt,
            referenceFiles,
            resolved,
            controller.signal,
          )
        : await requestGenerate(
            config,
            enrichedPrompt,
            resolved,
            controller.signal,
          );

      // 5. Decode base64 → Blob → save to IndexedDB
      const images: ImageResult[] = [];
      for (const img of result.images) {
        const bytes = Uint8Array.from(atob(img.b64Json), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/png" });
        await saveImage(img.id, blob, aiMsgId);
        const localBlobUrl = URL.createObjectURL(blob);
        images.push({
          id: img.id,
          revisedPrompt: img.revisedPrompt,
          localBlobUrl,
        });
      }

      // 6. Update AI message to done
      await updateMessage(aiMsgId, {
        status: "done",
        images,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        await updateMessage(aiMsgId, {
          status: "error",
          content: "Generation cancelled",
        });
      } else {
        await updateMessage(aiMsgId, {
          status: "error",
          content: (err as Error).message ?? "Unknown error",
        });
      }
    } finally {
      setGenerating(sessionId, false);
      setAbortController(sessionId, null);
    }
  },
}));

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "json", "csv", "xml", "html", "css", "js", "ts", "tsx",
  "jsx", "yaml", "yml", "toml", "ini", "cfg", "log", "svg", "py", "sh",
]);

function isTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  if (file.type === "application/json" || file.type === "application/xml") return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXTENSIONS.has(ext);
}
