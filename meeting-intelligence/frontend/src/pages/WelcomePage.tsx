import { useProjects } from "@/hooks/useProjects";
import { motion } from "framer-motion";
import { FolderOpen, MessageSquare, Zap } from "lucide-react";
import { useState } from "react";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

const FEATURES = [
  {
    icon: FolderOpen,
    title: "Organize",
    desc: "Group recordings into projects",
  },
  {
    icon: Zap,
    title: "Transcribe",
    desc: "Powered by Groq Whisper",
  },
  {
    icon: MessageSquare,
    title: "Chat",
    desc: "Ask questions across meetings",
  },
];

export default function WelcomePage() {
  const { data: projects = [] } = useProjects();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <div className="flex h-full flex-col items-center justify-center gap-10 px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-center"
        >
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Meeting Intelligence
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Transcribe, summarize, and chat with your meeting recordings.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.07 }}
          className="grid w-full max-w-sm grid-cols-3 gap-3"
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-surface p-4 text-center"
            >
              <Icon size={16} className="mx-auto mb-2 text-accent" />
              <p className="text-xs font-semibold text-text-primary">{title}</p>
              <p className="mt-0.5 text-2xs text-text-muted">{desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.14 }}
        >
          {projects.length === 0 ? (
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Create your first project
            </button>
          ) : (
            <p className="text-sm text-text-muted">
              Select a project from the sidebar to get started.
            </p>
          )}
        </motion.div>
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
