import { useDeleteProject, useProjects, useStorageInfo } from "@/hooks/useProjects";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/toastStore";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, LogOut, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import DeleteProjectDialog from "@/components/projects/DeleteProjectDialog";
import StorageInfoPanel from "@/components/ui/StorageInfo";

export default function Sidebar() {
  const { data: projects = [], isLoading, isError: projectsError } = useProjects();
  const { data: storageInfo } = useStorageInfo();
  const deleteProject = useDeleteProject();
  const { setActiveProject } = useAppStore();
  const { user, logout } = useAuthStore();
  const toast = useToast();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setActiveProject(null);
    navigate("/login", { replace: true });
  }

  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function handleSelect(projectSlug: string) {
    setActiveProject(projectSlug);
    navigate(`/projects/${projectSlug}`);
  }

  function handleDelete(projectSlug: string) {
    const name = projects.find((p) => p.slug === projectSlug)?.name ?? projectSlug;
    deleteProject.mutate(projectSlug, {
      onSuccess: () => {
        if (slug === projectSlug) {
          setActiveProject(null);
          navigate("/");
        }
        setPendingDelete(null);
        toast.success(`"${name}" deleted`);
      },
      onError: () => {
        toast.error("Failed to delete project");
      },
    });
  }

  return (
    <>
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-[14px]">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent-muted">
            <FolderOpen size={13} className="text-accent" />
          </div>
          <span className="font-display text-[13px] font-semibold tracking-wide text-text-primary">
            Meridian
          </span>
        </div>

        {/* Project list */}
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          <div className="mb-1 px-2 pt-1 text-2xs font-semibold uppercase tracking-widest text-text-muted">
            Projects
          </div>

          {isLoading && (
            <div className="flex flex-col gap-1 px-2 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 skeleton rounded-md" />
              ))}
            </div>
          )}

          <AnimatePresence initial={false}>
            {projects.map((p) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors",
                  slug === p.slug
                    ? "bg-accent-muted text-text-primary"
                    : "text-text-secondary hover:bg-border/60 hover:text-text-primary",
                )}
                onClick={() => handleSelect(p.slug)}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium leading-snug">{p.name}</div>
                  <div className="mt-0.5 text-2xs text-text-muted">
                    {p.meeting_count} {p.meeting_count === 1 ? "meeting" : "meetings"} ·{" "}
                    {formatDate(p.created_at)}
                  </div>
                </div>
                <button
                  className="ml-1 shrink-0 rounded p-1 opacity-0 transition-all hover:text-error group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(p.slug);
                  }}
                  aria-label="Delete project"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isLoading && projectsError && (
            <p className="px-2 py-6 text-center text-xs text-error">
              Could not load projects.
              <br />
              Try logging out and back in.
            </p>
          )}

          {!isLoading && !projectsError && projects.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-text-muted">
              No projects yet.
              <br />
              Create one to get started.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-2 border-t border-border p-3">
          {storageInfo && <StorageInfoPanel info={storageInfo} />}
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={13} />
            New Project
          </button>

          {/* User info + logout */}
          <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-2xs font-semibold text-accent">
              {user?.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-2xs font-medium text-text-primary">
                {user?.display_name}
              </p>
              <p className="truncate text-2xs text-text-muted">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 rounded p-1 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />

      {pendingDelete && (
        <DeleteProjectDialog
          projectName={projects.find((p) => p.slug === pendingDelete)?.name ?? pendingDelete}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
          isLoading={deleteProject.isPending}
        />
      )}
    </>
  );
}
