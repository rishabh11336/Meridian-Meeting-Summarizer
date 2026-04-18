import { useChat } from "@/hooks/useChat";
import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";
import StarterChips from "./StarterChips";
import TypingIndicator from "./TypingIndicator";
import { Eraser, MessageSquare } from "lucide-react";

interface Props {
  slug: string;
  hasMeetings: boolean;
}

export default function ChatWindow({ slug, hasMeetings }: Props) {
  const { chatHistory, sendMessage, isLoading, error, clearChat } = useChat(slug);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const isEmpty = chatHistory.length === 0;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-accent" />
          <span className="text-sm font-semibold text-text-primary">Project Chat</span>
        </div>
        {!isEmpty && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <Eraser size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {isEmpty && hasMeetings && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted">
              <MessageSquare size={20} className="text-accent" />
            </div>
            <p className="text-sm text-text-secondary">
              Ask anything about your project meetings
            </p>
          </div>
        )}
        {isEmpty && !hasMeetings && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">Upload a meeting to start chatting.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {chatHistory.map((msg, i) => (
            <ChatMessageComponent key={i} message={msg} />
          ))}
          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-error">
            {error instanceof Error ? error.message : "Chat failed. Please try again."}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Starter chips */}
      {isEmpty && hasMeetings && (
        <StarterChips onSelect={(q) => sendMessage(q)} />
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} disabled={!hasMeetings} />
    </div>
  );
}
