import type { ChatMessage as ChatMsg } from "@/types/chat";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface Props {
  message: ChatMsg;
}

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 flex flex-col gap-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-2 flex flex-col gap-1 pl-4 list-decimal last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="relative before:absolute before:-left-3.5 before:top-[0.45em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current/40 before:opacity-60 [ol>&]:before:content-none [ol>&]:list-decimal">
      {children}
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic opacity-80">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block rounded bg-black/20 px-2 py-1.5 font-mono text-xs leading-relaxed">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-black/20 px-1 py-0.5 font-mono text-xs">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-md bg-black/20 p-2.5 last:mb-0">{children}</pre>
  ),
  h1: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
  h2: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
  h3: ({ children }) => <p className="mb-1 font-medium opacity-80">{children}</p>,
  hr: () => <hr className="my-2 border-current opacity-20" />,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-current/30 pl-3 italic opacity-70 last:mb-0">
      {children}
    </blockquote>
  ),
};

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-accent" : "bg-border"
        }`}
      >
        {isUser ? (
          <User size={12} className="text-white" />
        ) : (
          <Bot size={12} className="text-text-secondary" />
        )}
      </div>

      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "rounded-tr-sm bg-accent text-white"
            : "rounded-tl-sm border border-border bg-surface text-text-primary"
        }`}
      >
        {isUser ? (
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}
