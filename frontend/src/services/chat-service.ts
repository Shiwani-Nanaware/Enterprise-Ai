/**
 * Chat service — connects to the real backend chat API.
 */

import { apiClient } from "./api-client";
import type { Conversation, ConversationWithMessages, Message, PaginatedApiResponse } from "@/types";

export interface SendMessagePayload {
  content: string;
  conversation_id?: string | null;
}

export interface ChatResponseData {
  conversation_id: string;
  message: Message;
  sources: Array<{
    document_id: string;
    document_title: string;
    chunk_index: number;
    content_preview: string;
    similarity_score: number;
    department: string;
  }>;
}

export async function sendMessage(payload: SendMessagePayload): Promise<ChatResponseData> {
  const response = await apiClient.post<{ success: true; data: ChatResponseData }>(
    "/chat",
    { content: payload.content, conversation_id: payload.conversation_id ?? null }
  );
  return response.data.data;
}

export async function listConversations(page = 1, pageSize = 50): Promise<PaginatedApiResponse<Conversation>> {
  const response = await apiClient.get<PaginatedApiResponse<Conversation>>(
    "/chat/conversations",
    { params: { page, page_size: pageSize } }
  );
  return response.data;
}

export async function getConversation(id: string): Promise<ConversationWithMessages> {
  const response = await apiClient.get<{ success: true; data: ConversationWithMessages }>(
    `/chat/conversations/${id}`
  );
  return response.data.data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/chat/conversations/${id}`);
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  const response = await apiClient.patch<{ success: true; data: Conversation }>(
    `/chat/conversations/${id}/rename`,
    { title }
  );
  return response.data.data;
}

export async function getChatHistory(conversationId: string, limit = 50): Promise<Message[]> {
  const response = await apiClient.get<{ success: true; data: Message[] }>(
    `/chat/history/${conversationId}`,
    { params: { limit } }
  );
  return response.data.data;
}

export async function submitFeedback(
  messageId: string,
  feedback: "positive" | "negative"
): Promise<Message> {
  const response = await apiClient.post<{ success: true; data: Message }>(
    `/chat/feedback/${messageId}`,
    { feedback }
  );
  return response.data.data;
}
