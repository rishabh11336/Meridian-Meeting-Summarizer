import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  lines?: number;
}

export default function SkeletonRow({ className, lines = 1 }: Props) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded skeleton"
          style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
