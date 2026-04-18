/**
 * UploadPanel.tsx
 *
 * Upload pipeline:
 *   1. User selects / drops a video file
 *   2. FFmpeg.wasm extracts audio to mono 16 kHz WAV in-browser (client-side)
 *   3. WAV uploaded to backend (multipart/form-data)
 *   4. Backend: chunks WAV → Groq Whisper → transcript
 *   5. User reviews / edits transcript
 *   6. User confirms → Gemini generates structured summary
 *
 * Cross-origin isolation required by FFmpeg.wasm is provided by
 * coi-serviceworker (registered in index.html), not by server headers.
 */

import ProgressTracker from "./ProgressTracker";
import TranscriptEditor from "./TranscriptEditor";
import { useAudioExtractor } from "@/hooks/useAudioExtractor";
import { useToast } from "@/store/toastStore";
import { useSummarizeMeeting, useUploadMeeting } from "@/hooks/useMeetings";
import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { TranscriptionResult } from "@/types/meeting";

type Stage =
  | "idle"
  | "extracting"
  | "uploading"
  | "transcribing"
  | "reviewing"
  | "summarizing"
  | "done";

interface Props {
  slug: string;
  onSummarized: (meetingId: string) => void;
}

const ACCEPTED_EXTS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".wmv"];
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

export default function UploadPanel({ slug, onSummarized }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [transcriptionResult, setTranscriptionResult] =
    useState<TranscriptionResult | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const { extractAudio, progress: extractPct } = useAudioExtractor();
  const uploadMeeting = useUploadMeeting(slug);
  const summarizeMeeting = useSummarizeMeeting(
    slug,
    transcriptionResult?.meeting_id ?? ""
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      setUploadPct(0);

      // ── Validate ──────────────────────────────────────────────────────────
      const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!ACCEPTED_EXTS.includes(ext)) {
        const msg = `Unsupported format "${ext}". Accepted: ${ACCEPTED_EXTS.join(", ")}`;
        setError(msg);
        toast.error(msg);
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        const msg = `File too large (${(file.size / 1e6).toFixed(0)} MB). Max is 500 MB.`;
        setError(msg);
        toast.error(msg);
        return;
      }

      // ── Step 1: Extract audio client-side ─────────────────────────────────
      setStage("extracting");
      let audioFile: File;
      try {
        audioFile = await extractAudio(file);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Audio extraction failed.";
        setError(msg);
        toast.error(msg);
        setStage("idle");
        return;
      }

      // ── Step 2: Upload WAV → backend transcribes ──────────────────────────
      setStage("uploading");
      uploadMeeting.mutate(
        {
          file: audioFile,
          onProgress: (pct: number) => {
            setUploadPct(pct);
            if (pct === 100) setStage("transcribing");
          },
        },
        {
          onSuccess: (result) => {
            setTranscriptionResult(result);
            setStage("reviewing");
          },
          onError: (err: unknown) => {
            const raw = err as {
              response?: { data?: { detail?: string } };
              message?: string;
            };
            const msg =
              raw?.response?.data?.detail ??
              raw?.message ??
              "Upload failed. Please try again.";
            setError(msg);
            toast.error(msg);
            setStage("idle");
          },
        }
      );
    },
    [extractAudio, uploadMeeting, toast]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSummarize(text: string, useCorrection: boolean) {
    if (!transcriptionResult) return;
    setStage("summarizing");
    summarizeMeeting.mutate(
      { transcript: text, use_correction: useCorrection },
      {
        onSuccess: () => {
          setStage("done");
          toast.success("Summary generated!");
          onSummarized(transcriptionResult.meeting_id);
        },
        onError: (err: unknown) => {
          const raw = err as {
            response?: { data?: { detail?: string } };
            message?: string;
          };
          const msg =
            raw?.response?.data?.detail ??
            raw?.message ??
            "Summarization failed. Please try again.";
          setError(msg);
          toast.error(msg);
          setStage("reviewing");
        },
      }
    );
  }

  // ── Transcript review / summarizing ───────────────────────────────────────
  if (stage === "reviewing" || stage === "summarizing") {
    return (
      <TranscriptEditor
        transcript={transcriptionResult!.transcript}
        onConfirm={handleSummarize}
        isLoading={stage === "summarizing"}
      />
    );
  }

  // ── In-flight progress ────────────────────────────────────────────────────
  if (stage === "extracting" || stage === "uploading" || stage === "transcribing") {
    const extractHint = `Extracting audio in browser… ${extractPct}%`;

    return (
      <div className="flex flex-col gap-3">
        <ProgressTracker
          stage={stage === "transcribing" ? "transcribing" : stage}
          pct={stage === "extracting" ? extractPct : uploadPct}
          hint={stage === "extracting" ? extractHint : undefined}
        />
        {stage === "transcribing" && (
          <>
            <p className="animate-pulse text-center text-xs text-text-muted">
              Transcribing with Groq Whisper — may take a few minutes for long recordings…
            </p>
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-600/80">
              <span className="font-medium">Free tier:</span> If transcription hangs or fails, the daily quota (2 hr audio) may be exhausted. Contact your admin.
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Idle drop zone ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-12 text-center transition-all ${
          dragOver
            ? "border-accent bg-accent-muted"
            : "border-border bg-surface hover:border-accent/40 hover:bg-surface-raised"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted">
          <Upload size={20} className="text-accent" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {dragOver ? "Drop to upload" : "Drop a video file here"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            or click to browse · MP4, MOV, AVI, MKV, WEBM up to 500 MB
          </p>
          <p className="mt-1 text-xs text-text-muted opacity-60">
            Audio extracted in browser · only WAV sent to server
          </p>
        </div>
      </div>

      <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-600/80">
        <span className="font-medium">Free tier notice:</span> Transcription runs on Groq's free API (2 hr/day limit).
        If uploads stop working, the daily quota may be exhausted — contact your admin.
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_EXTS.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}
    </div>
  );
}
