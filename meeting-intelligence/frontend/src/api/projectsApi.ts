import type {
  ProjectCreate,
  ProjectListResponse,
  ProjectMeta,
  ProjectRename,
  StorageInfo,
} from "@/types/project";
import client from "./client";

export async function listProjects(): Promise<ProjectListResponse> {
  const { data } = await client.get<ProjectListResponse>("/projects");
  return data;
}

export async function createProject(payload: ProjectCreate): Promise<ProjectMeta> {
  const { data } = await client.post<ProjectMeta>("/projects", payload);
  return data;
}

export async function getProject(slug: string): Promise<ProjectMeta> {
  const { data } = await client.get<ProjectMeta>(`/projects/${slug}`);
  return data;
}

export async function renameProject(slug: string, payload: ProjectRename): Promise<ProjectMeta> {
  const { data } = await client.patch<ProjectMeta>(`/projects/${slug}`, payload);
  return data;
}

export async function deleteProject(slug: string): Promise<void> {
  await client.delete(`/projects/${slug}`);
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const { data } = await client.get<StorageInfo>("/storage");
  return data;
}
