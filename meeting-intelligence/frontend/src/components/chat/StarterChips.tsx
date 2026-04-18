const STARTERS = [
  "What were the key decisions made?",
  "What action items were assigned?",
  "Summarize the main discussion topics.",
  "Were there any blockers mentioned?",
  "What deadlines or dates came up?",
];

interface Props {
  onSelect: (question: string) => void;
}

export default function StarterChips({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
      {STARTERS.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-accent/40 hover:bg-accent-muted hover:text-text-primary"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
