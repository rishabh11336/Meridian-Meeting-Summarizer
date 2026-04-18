import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "accent";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-border text-text-secondary",
        variant === "success" && "bg-green-500/10 text-success",
        variant === "warning" && "bg-amber-500/10 text-warning",
        variant === "error" && "bg-red-500/10 text-error",
        variant === "accent" && "bg-accent-muted text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
