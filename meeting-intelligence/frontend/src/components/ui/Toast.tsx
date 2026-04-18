import { useToastStore, type Toast } from "@/store/toastStore";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();

  const icons = {
    success: <CheckCircle2 size={15} className="text-success shrink-0" />,
    error: <XCircle size={15} className="text-error shrink-0" />,
    info: <Info size={15} className="text-accent shrink-0" />,
  };

  const borders = {
    success: "border-success/20",
    error: "border-error/20",
    info: "border-accent/20",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex items-center gap-3 rounded-lg border bg-surface-raised px-4 py-3 text-sm text-text-primary shadow-lg ${borders[toast.variant]}`}
    >
      {icons[toast.variant]}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-1 rounded p-0.5 text-text-muted hover:text-text-primary"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
