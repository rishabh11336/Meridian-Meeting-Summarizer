import { useRef, useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isLoading, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-surface px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled ? "Upload a meeting to start chatting…" : "Ask about your meetings…"
        }
        disabled={disabled ?? isLoading}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none disabled:opacity-50"
        style={{ maxHeight: "160px" }}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading || disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        aria-label="Send message"
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Send size={14} />
        )}
      </button>
    </div>
  );
}
