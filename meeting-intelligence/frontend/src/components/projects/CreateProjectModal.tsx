import { useCreateProject } from "@/hooks/useProjects";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/store/toastStore";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const createProject = useCreateProject();
  const { setActiveProject } = useAppStore();
  const toast = useToast();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    createProject.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: (project) => {
          setActiveProject(project.slug);
          navigate(`/projects/${project.slug}`);
          toast.success(`"${project.name}" created`);
          setName("");
          setDescription("");
          onClose();
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to create project.";
          setError(msg);
        },
      },
    );
  }

  function handleClose() {
    setName("");
    setDescription("");
    setError("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-text-primary">
                New Project
              </h2>
              <button
                onClick={handleClose}
                className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Q4 Strategy Review"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
                  maxLength={80}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Description{" "}
                  <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Weekly leadership syncs for Q4 planning..."
                  rows={2}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
                  maxLength={200}
                />
              </div>

              {error && <p className="text-xs text-error">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {createProject.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
