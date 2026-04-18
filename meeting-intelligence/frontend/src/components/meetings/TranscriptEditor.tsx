import { useState } from "react";
import { CheckCheck, RotateCcw } from "lucide-react";

interface Props {
  transcript: string;
  onConfirm: (text: string, useAsCorrection: boolean) => void;
  isLoading: boolean;
}

export default function TranscriptEditor({ transcript, onConfirm, isLoading }: Props) {
  const [text, setText] = useState(transcript);
  const isDirty = text !== transcript;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Review Transcript</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Fix names, terminology, or remove filler words before summarizing.
          </p>
        </div>
        {isDirty && (
          <button
            onClick={() => setText(transcript)}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-3 font-mono text-xs leading-relaxed text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
        placeholder="Transcript will appear here…"
      />

      <button
        onClick={() => onConfirm(text, isDirty)}
        disabled={isLoading || !text.trim()}
        className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating summary…
          </>
        ) : (
          <>
            <CheckCheck size={15} />
            {isDirty ? "Save corrections & summarize" : "Summarize"}
          </>
        )}
      </button>
    </div>
  );
}
