import type { ChatMessage } from "@/types/chat";
import { create } from "zustand";

interface AppState {
  activeProjectSlug: string | null;
  chatHistory: ChatMessage[];
  setActiveProject: (slug: string | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectSlug: null,
  chatHistory: [],
  setActiveProject: (slug) =>
    set({ activeProjectSlug: slug, chatHistory: [] }),
  addChatMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),
}));
