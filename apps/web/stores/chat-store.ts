import type { Message } from "@super-image/utils";
import { create } from "zustand";

import {
  addMessage as dbAddMessage,
  getMessagesBySession,
  updateMessage as dbUpdateMessage,
} from "@/lib/db";

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
}));
