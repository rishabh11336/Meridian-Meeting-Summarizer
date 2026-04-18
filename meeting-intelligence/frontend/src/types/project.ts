export interface ProjectMeta {
  name: string;
  slug: string;
  description: string;
  created_at: string;
  meeting_count: number;
}

export interface ProjectCreate {
  name: string;
  description: string;
}

export interface ProjectRename {
  new_name: string;
}

export interface ProjectListResponse {
  projects: ProjectMeta[];
}

export interface StorageInfo {
  projects_size_mb: number;
  total_projects: number;
  total_meetings: number;
  free_disk_gb: number;
}
