import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-3"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-border">
        <span className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-text-muted animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-3.5 py-2.5">
        <span className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-text-muted animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}
