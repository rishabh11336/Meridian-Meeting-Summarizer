import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

type Stage = "extracting" | "uploading" | "transcribing" | "summarizing" | "done";

interface Props {
  stage: Stage;
  /** 0–100, shown under the active "extracting" or "uploading" step. */
  pct: number;
  /** Optional sub-label shown under the active step (e.g. "Loading extractor…"). */
  hint?: string;
}

const STEPS: { key: Stage; label: string; defaultHint: string }[] = [
  { key: "extracting",  label: "Extracting audio",  defaultHint: "Running in browser…" },
  { key: "uploading",   label: "Uploading audio",   defaultHint: "Sending to server…" },
  { key: "transcribing", label: "Transcribing audio", defaultHint: "Powered by Groq Whisper" },
  { key: "summarizing", label: "Generating summary", defaultHint: "Powered by Gemini" },
];

const ORDER: Stage[] = ["extracting", "uploading", "transcribing", "summarizing", "done"];

export default function ProgressTracker({ stage, pct, hint }: Props) {
  const currentIdx = ORDER.indexOf(stage);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-widest text-text-muted">
        Processing
      </p>
      <div className="flex flex-col gap-4">
        {STEPS.map((step, i) => {
          const isDone   = currentIdx > i;
          const isActive = currentIdx === i;
          const showBar  = isActive && (step.key === "extracting" || step.key === "uploading");

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 size={16} className="text-success" />
                ) : isActive ? (
                  <Loader2 size={16} className="animate-spin text-accent" />
                ) : (
                  <Circle size={16} className="text-text-muted" />
                )}
              </div>

              <div className="flex-1">
                <span
                  className={`block text-sm leading-snug ${
                    isDone
                      ? "text-text-muted line-through"
                      : isActive
                        ? "font-medium text-text-primary"
                        : "text-text-muted"
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span className="mt-0.5 block text-xs text-text-muted">
                    {hint ?? step.defaultHint}
                  </span>
                )}
                {showBar && (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                )}
              </div>

              {showBar && (
                <span className="text-xs tabular-nums text-text-muted">
                  {pct}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
