import Badge from "@/components/ui/Badge";
import { formatDate, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { MeetingMeta } from "@/types/meeting";
import { Clock, Trash2 } from "lucide-react";

interface Props {
  meeting: MeetingMeta;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function MeetingCard({ meeting, isActive, onSelect, onDelete }: Props) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-lg border p-3 transition-all",
        isActive
          ? "border-accent/50 bg-accent-muted"
          : "border-border bg-surface hover:border-border hover:bg-surface-raised",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-text-primary leading-snug">
          {meeting.original_filename}
        </p>
        <button
          className="ml-1 shrink-0 rounded p-0.5 text-text-muted opacity-0 transition-all hover:text-error group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete meeting"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-2xs text-text-muted">
        <span className="flex items-center gap-1">
          <Clock size={9} />
          {formatDuration(meeting.duration_seconds)}
        </span>
        <span>·</span>
        <span>{formatDate(meeting.uploaded_at)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {meeting.has_summary ? (
          <Badge variant="success">Summarized</Badge>
        ) : (
          <Badge variant="warning">No summary</Badge>
        )}
        {meeting.has_correction && <Badge variant="accent">Corrected</Badge>}
      </div>
    </div>
  );
}
