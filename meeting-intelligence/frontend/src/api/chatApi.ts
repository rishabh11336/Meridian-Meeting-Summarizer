import type { ChatRequest, ChatResponse } from "@/types/chat";
import client from "./client";

export async function sendMessage(slug: string, payload: ChatRequest): Promise<ChatResponse> {
  const { data } = await client.post<ChatResponse>(`/projects/${slug}/chat`, payload);
  return data;
}
