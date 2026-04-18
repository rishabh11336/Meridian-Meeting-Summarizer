import { sendMessage } from "@/api/chatApi";
import { useAppStore } from "@/store/appStore";
import { useMutation } from "@tanstack/react-query";

export function useChat(slug: string) {
  const { chatHistory, addChatMessage, clearChat } = useAppStore();

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      addChatMessage({ role: "user", content: question });
      const res = await sendMessage(slug, { question, history: chatHistory });
      addChatMessage({ role: "model", content: res.answer });
      return res;
    },
  });

  return {
    chatHistory,
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearChat,
  };
}
