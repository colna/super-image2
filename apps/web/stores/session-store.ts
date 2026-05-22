import type { Session } from "@super-image/utils";
import { create } from "zustand";

import {
  addSession as dbAddSession,
  deleteSession as dbDeleteSession,
  getAllSessions,
  updateSession as dbUpdateSession,
} from "@/lib/db";

export interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  loading: boolean;

  // Actions
  loadSessions: () => Promise<void>;
  createSession: (session: Session) => Promise<void>;
  setActiveSessionId: (id: string | null) => void;
  getSession: (id: string) => Session | undefined;
  updateSession: (id: string, changes: Partial<Session>) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: [],
  activeSessionId: null,
  loading: false,

  loadSessions: async () => {
    set({ loading: true });
    const sessions = await getAllSessions();
    set({ sessions, loading: false });
  },

  createSession: async (session) => {
    await dbAddSession(session);
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
    }));
  },

  setActiveSessionId: (id) => set({ activeSessionId: id }),

  getSession: (id) => get().sessions.find((s) => s.id === id),

  updateSession: async (id, changes) => {
    await dbUpdateSession(id, changes);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...changes } : s,
      ),
    }));
  },

  removeSession: async (id) => {
    await dbDeleteSession(id);
    const state = get();
    const remaining = state.sessions.filter((s) => s.id !== id);
    set({
      sessions: remaining,
      activeSessionId:
        state.activeSessionId === id
          ? (remaining[0]?.id ?? null)
          : state.activeSessionId,
    });
  },
}));
