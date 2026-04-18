interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, actions }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-text-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="ml-4 flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
