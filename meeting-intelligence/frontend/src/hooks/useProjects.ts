import {
  createProject,
  deleteProject,
  getStorageInfo,
  listProjects,
  renameProject,
} from "@/api/projectsApi";
import type { ProjectCreate, ProjectRename } from "@/types/project";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    select: (data) => data.projects,
  });
}

export function useStorageInfo() {
  return useQuery({
    queryKey: ["storage"],
    queryFn: getStorageInfo,
    refetchInterval: 30_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectCreate) => createProject(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["storage"] });
    },
  });
}

export function useRenameProject(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectRename) => renameProject(slug, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteProject(slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["storage"] });
    },
  });
}
