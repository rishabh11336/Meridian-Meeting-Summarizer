import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Props {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function DeleteProjectDialog({
  projectName,
  onConfirm,
  onCancel,
  isLoading,
}: Props) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface p-6"
        >
          <div className="mb-5 flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-red-500/10 p-2 shrink-0">
              <AlertTriangle size={15} className="text-error" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-text-primary">
                Delete project?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                <span className="font-medium text-text-primary">"{projectName}"</span> and all its
                meetings will be permanently deleted. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="rounded-md bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
