import type { Attachment, ImageInput, ImageResult, Message } from "@super-image/utils";
import { create } from "zustand";

import {
  addMessage as dbAddMessage,
  getImage,
  getMessagesBySession,
  saveAttachment,
  saveImage,
  updateMessage as dbUpdateMessage,
} from "@/lib/db";
import { getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";

export interface ChatState {
  messages: Message[];
  loading: boolean;
  generating: boolean;
  abortController: AbortController | null;

  // Actions
  loadMessages: (sessionId: string) => Promise<void>;
  addMessage: (message: Message) => Promise<void>;
  updateMessage: (id: string, changes: Partial<Message>) => Promise<void>;
  setGenerating: (generating: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelGeneration: () => void;
  clearMessages: () => void;
  sendGenerate: (
    sessionId: string,
    prompt: string,
    params: { size: string; quality: string; n: number },
  ) => Promise<void>;
  sendEdit: (
    sessionId: string,
    prompt: string,
    sourceImageId: string,
    params: { size: string; quality: string; n: number },
  ) => Promise<void>;
  sendGenerateWithRefs: (
    sessionId: string,
    prompt: string,
    attachmentFiles: File[],
    params: { size: string; quality: string; n: number },
  ) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  loading: false,
  generating: false,
  abortController: null,

  loadMessages: async (sessionId) => {
    set({ loading: true });
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

  setGenerating: (generating) => set({ generating }),

  setAbortController: (controller) => set({ abortController: controller }),

  cancelGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, generating: false });
    }
  },

  clearMessages: () => set({ messages: [] }),

  sendGenerate: async (sessionId, prompt, params) => {
    const { addMessage, updateMessage, setGenerating, setAbortController } = get();
    const settings = useSettingsStore.getState();
    const config = settings.providers[settings.activeProviderId];
    const provider = getProvider(config?.providerType ?? settings.activeProviderId);

    if (!config || !provider) return;

    // 1. Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sessionId,
      role: "user",
      type: "generate",
      content: prompt,
      createdAt: Date.now(),
      status: "done",
      params: { model: config.defaultModel, ...params },
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
      params: { model: config.defaultModel, ...params },
    };
    await addMessage(aiMsg);

    // 3. Call provider
    const controller = new AbortController();
    setAbortController(controller);
    setGenerating(true);

    try {
      const result = await provider.generate(
        prompt,
        { model: config.defaultModel, ...params },
        config,
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
      setGenerating(false);
      setAbortController(null);
    }
  },

  sendEdit: async (sessionId, prompt, sourceImageId, params) => {
    const { addMessage, updateMessage, setGenerating, setAbortController } = get();
    const settings = useSettingsStore.getState();
    const config = settings.providers[settings.activeProviderId];
    const provider = getProvider(config?.providerType ?? settings.activeProviderId);

    if (!config || !provider || !provider.edit) return;

    // 1. Load source image blob from IndexedDB
    const stored = await getImage(sourceImageId);
    if (!stored) return;

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
      params: { model: config.defaultModel, ...params },
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
      params: { model: config.defaultModel, ...params },
    };
    await addMessage(aiMsg);

    // 4. Call provider.edit
    const controller = new AbortController();
    setAbortController(controller);
    setGenerating(true);

    try {
      const result = await provider.edit(
        prompt,
        stored.blob,
        { model: config.defaultModel, ...params },
        config,
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
      setGenerating(false);
      setAbortController(null);
    }
  },

  sendGenerateWithRefs: async (sessionId, prompt, attachmentFiles, params) => {
    const { addMessage, updateMessage, setGenerating, setAbortController } = get();
    const settings = useSettingsStore.getState();
    const config = settings.providers[settings.activeProviderId];
    const provider = getProvider(config?.providerType ?? settings.activeProviderId);

    if (!config || !provider || !provider.generateWithRefs) return;

    // 1. Build attachments metadata + convert files to base64 data URLs
    const userMsgId = crypto.randomUUID();
    const attachments: Attachment[] = [];
    const referenceImages: ImageInput[] = [];

    for (const file of attachmentFiles) {
      const id = crypto.randomUUID();
      attachments.push({
        id,
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "file",
        mimeType: file.type,
        size: file.size,
      });

      // Save to attachmentStore
      await saveAttachment(id, file, userMsgId, file.name, file.type);

      // Convert image files to base64 data URL for API
      if (file.type.startsWith("image/")) {
        const base64 = await fileToBase64DataUrl(file);
        referenceImages.push({ base64DataUrl: base64 });
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
      params: { model: config.defaultModel, ...params },
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
      params: { model: config.defaultModel, ...params },
    };
    await addMessage(aiMsg);

    // 4. Call provider.generateWithRefs
    const controller = new AbortController();
    setAbortController(controller);
    setGenerating(true);

    try {
      const result = await provider.generateWithRefs(
        prompt,
        referenceImages,
        { model: config.defaultModel, ...params },
        config,
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
      setGenerating(false);
      setAbortController(null);
    }
  },
}));

function fileToBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
