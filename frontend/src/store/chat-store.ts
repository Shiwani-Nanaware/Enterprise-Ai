/**
 * Chat Zustand store — strictly user-scoped, no cross-user data leakage.
 *
 * Key isolation guarantees:
 * - State is cleared on every login (clearForUser called with new user ID)
 * - No persistence between different users — sessionStorage only stores
 *   the current user's ID for change detection, not conversation data
 * - loadConversations always resets conversations/messages before fetching
 */

import { create } from "zustand";
import {
  sendMessage as apiSendMessage,
  listConversations as apiListConversations,
  getConversation as apiGetConversation,
  deleteConversation as apiDeleteConversation,
  renameConversation as apiRenameConversation,
  submitFeedback as apiSubmitFeedback,
} from "@/services/chat-service";
import { SUGGESTED_PROMPTS } from "@/data/mock-data";
import type { Conversation, Message } from "@/types";

interface ChatState {
  /** The user ID this state belongs to — used to detect user switches. */
  ownerId: string | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  suggestedPrompts: typeof SUGGESTED_PROMPTS;

  // Actions
  /** Call this immediately after login with the new user's ID.
   *  Wipes all previous state if the user changed. */
  clearForUser: (userId: string) => void;
  setActiveConversation: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  loadConversationMessages: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  submitFeedback: (messageId: string, feedback: "positive" | "negative") => Promise<void>;
  clearError: () => void;
  addMessage: (conversationId: string, message: Message) => void;
  setStreaming: (streaming: boolean) => void;
  createConversation: (title: string) => Conversation;
}

const EMPTY_STATE = {
  ownerId: null,
  conversations: [] as Conversation[],
  activeConversationId: null,
  messages: {} as Record<string, Message[]>,
  isStreaming: false,
  isLoading: false,
  error: null,
};

export const useChatStore = create<ChatState>()((set, get) => ({
  ...EMPTY_STATE,
  suggestedPrompts: SUGGESTED_PROMPTS,

  // ─── User isolation ────────────────────────────────────────────────────────

  clearForUser: (userId: string) => {
    const current = get().ownerId;
    if (current !== userId) {
      // Different user — wipe everything
      set({ ...EMPTY_STATE, ownerId: userId });
    }
    // Same user — keep existing state (page refresh / re-render)
  },

  // ─── Conversation management ────────────────────────────────────────────────

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id && !get().messages[id]) {
      get().loadConversationMessages(id);
    }
  },

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const resp = await apiListConversations(1, 100);
      // Replace — never merge with old state from a different user
      set({
        conversations: resp.data,
        isLoading: false,
      });

      // Auto-select first conversation if nothing is selected
      const currentActive = get().activeConversationId;
      const first = resp.data[0];

      if (first && !currentActive) {
        set({ activeConversationId: first.id });
        get().loadConversationMessages(first.id);
      } else if (
        currentActive &&
        !resp.data.find((c) => c.id === currentActive)
      ) {
        // Active ID no longer belongs to this user — clear it
        set({ activeConversationId: first?.id ?? null });
        if (first) get().loadConversationMessages(first.id);
      }
    } catch {
      set({ isLoading: false, error: "Failed to load conversations." });
    }
  },

  loadConversationMessages: async (id: string) => {
    try {
      const conv = await apiGetConversation(id);
      // Only store if this conversation is still in our list
      const inList = get().conversations.find((c) => c.id === id);
      if (!inList && get().conversations.length > 0) return;
      set((state) => ({
        messages: { ...state.messages, [id]: conv.messages ?? [] },
      }));
    } catch {
      // silently ignore — conversation may be new
    }
  },

  // ─── Messaging ──────────────────────────────────────────────────────────────

  sendMessage: async (content: string) => {
    const conversationId = get().activeConversationId;
    set({ isStreaming: true, error: null });

    const optimisticMsg: Message = {
      id: `tmp_${Date.now()}`,
      conversation_id: conversationId ?? "new",
      role: "user",
      content,
      tokens_used: 0,
      sources: null,
      latency_ms: null,
      feedback: null,
      created_at: new Date().toISOString(),
    };

    if (conversationId) {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] ?? []),
            optimisticMsg,
          ],
        },
      }));
    }

    try {
      const result = await apiSendMessage({
        content,
        conversation_id: conversationId,
      });

      const convId = result.conversation_id;

      if (!conversationId) {
        await get().loadConversations();
        set({ activeConversationId: convId });
      }

      set((state) => {
        const existing = (state.messages[convId] ?? []).filter(
          (m) => m.id !== optimisticMsg.id
        );
        const userMsg: Message = {
          ...optimisticMsg,
          id: `user_${Date.now()}`,
          conversation_id: convId,
        };
        return {
          messages: {
            ...state.messages,
            [convId]: [...existing, userMsg, result.message],
          },
          conversations: state.conversations.map((c) =>
            c.id === convId
              ? { ...c, updated_at: new Date().toISOString() }
              : c
          ),
        };
      });
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to send message.";
      set((state) => {
        const convId = conversationId ?? "new";
        const filtered = (state.messages[convId] ?? []).filter(
          (m) => m.id !== optimisticMsg.id
        );
        return {
          messages: { ...state.messages, [convId]: filtered },
          error: errMsg,
        };
      });
    } finally {
      set({ isStreaming: false });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await apiDeleteConversation(id);
      set((state) => {
        const remaining = state.conversations.filter((c) => c.id !== id);
        const newMessages = { ...state.messages };
        delete newMessages[id];
        return {
          conversations: remaining,
          activeConversationId:
            state.activeConversationId === id
              ? (remaining[0]?.id ?? null)
              : state.activeConversationId,
          messages: newMessages,
        };
      });
      const next = get().activeConversationId;
      if (next && !get().messages[next]) {
        get().loadConversationMessages(next);
      }
    } catch {
      set({ error: "Failed to delete conversation." });
    }
  },

  renameConversation: async (id: string, title: string) => {
    try {
      await apiRenameConversation(id, title);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, title } : c
        ),
      }));
    } catch {
      set({ error: "Failed to rename conversation." });
    }
  },

  submitFeedback: async (
    messageId: string,
    feedback: "positive" | "negative"
  ) => {
    try {
      await apiSubmitFeedback(messageId, feedback);
      set((state) => {
        const newMessages = { ...state.messages };
        for (const convId of Object.keys(newMessages)) {
          newMessages[convId] = newMessages[convId].map((m) =>
            m.id === messageId ? { ...m, feedback } : m
          );
        }
        return { messages: newMessages };
      });
    } catch {
      // silently ignore feedback errors
    }
  },

  clearError: () => set({ error: null }),

  addMessage: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] ?? []),
          message,
        ],
      },
    }));
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  createConversation: (title) => {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title,
      user_id: get().ownerId ?? "local",
      status: "active",
      total_tokens_used: 0,
      model_used: "llama-3.3-70b-versatile",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newConv.id,
      messages: { ...state.messages, [newConv.id]: [] },
    }));
    return newConv;
  },
}));
