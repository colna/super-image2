import type { ImageResult, Message } from "@super-image/utils";
import { create } from "zustand";

import {
  addMessage as dbAddMessage,
  getMessagesBySession,
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
    await dbUpdateMessage(id, changes);
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
    const provider = getProvider(settings.activeProviderId);

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
}));
