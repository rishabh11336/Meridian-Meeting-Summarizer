import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted">
        <Icon size={20} className="text-accent" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
