export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatRequest {
  question: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
}
