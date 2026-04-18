import type { StorageInfo } from "@/types/project";
import { HardDrive } from "lucide-react";

interface Props {
  info: StorageInfo;
}

export default function StorageInfoPanel({ info }: Props) {
  const usedPct = Math.min(
    100,
    (info.projects_size_mb / (info.free_disk_gb * 1024 + info.projects_size_mb)) * 100,
  );

  return (
    <div className="rounded-md border border-border bg-background p-2.5 text-xs text-text-muted">
      <div className="mb-2 flex items-center gap-1.5 text-text-secondary">
        <HardDrive size={11} />
        <span className="font-medium">Storage</span>
      </div>
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent/60 transition-all"
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Used</span>
          <span className="tabular-nums text-text-secondary">
            {info.projects_size_mb.toFixed(1)} MB
          </span>
        </div>
        <div className="flex justify-between">
          <span>Free</span>
          <span className="tabular-nums text-text-secondary">
            {info.free_disk_gb.toFixed(1)} GB
          </span>
        </div>
        <div className="flex justify-between">
          <span>Meetings</span>
          <span className="tabular-nums text-text-secondary">{info.total_meetings}</span>
        </div>
      </div>
    </div>
  );
}
