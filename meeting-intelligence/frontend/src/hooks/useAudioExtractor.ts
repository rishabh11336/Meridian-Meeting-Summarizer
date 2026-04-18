/**
 * useAudioExtractor — Web Audio API implementation.
 *
 * Extracts audio from a video file entirely in the browser using native APIs:
 *   AudioContext.decodeAudioData  → decode compressed audio from the video file
 *   OfflineAudioContext           → resample to 16 kHz mono
 *   Manual WAV encoder            → produce a standard PCM WAV file
 *
 * No FFmpeg.wasm, no WASM at all, no service worker, no COEP/COOP headers needed.
 * Chrome's native media decoder handles every common meeting format (MP4, WebM,
 * MOV, MKV). The resulting WAV is exactly what Groq Whisper expects.
 */

import { useState } from "react";

export type ExtractionStatus = "idle" | "extracting" | "done" | "error";

export interface UseAudioExtractor {
  status: ExtractionStatus;
  /** 0–100 while status === "extracting". */
  progress: number;
  extractAudio: (videoFile: File) => Promise<File>;
}

export function useAudioExtractor(): UseAudioExtractor {
  const [status, setStatus] = useState<ExtractionStatus>("idle");
  const [progress, setProgress] = useState(0);

  async function extractAudio(videoFile: File): Promise<File> {
    setStatus("extracting");
    setProgress(0);

    try {
      // 1. Read the video file into memory.
      const arrayBuffer = await videoFile.arrayBuffer();
      setProgress(15);

      // 2. Decode the audio track using the browser's native media decoder.
      //    Works with MP4, WebM, MOV, MKV, AVI — anything Chrome can play.
      const decodeCtx = new AudioContext();
      const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
      await decodeCtx.close();
      setProgress(55);

      // 3. Resample to 16 kHz mono via OfflineAudioContext.
      const TARGET_SAMPLE_RATE = 16_000;
      const numFrames = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE);
      const offlineCtx = new OfflineAudioContext(1, numFrames, TARGET_SAMPLE_RATE);
      const source = offlineCtx.createBufferSource();
      source.buffer = decoded;

      // Mix all channels down to mono by connecting directly to destination.
      source.connect(offlineCtx.destination);
      source.start(0);

      const rendered = await offlineCtx.startRendering();
      setProgress(85);

      // 4. Encode to 16-bit PCM WAV.
      const wav = encodeWav(rendered);
      setProgress(100);
      setStatus("done");

      const name = videoFile.name.replace(/\.[^.]+$/, ".wav");
      return new File([wav], name, { type: "audio/wav" });
    } catch (err) {
      setStatus("error");
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  return { status, progress, extractAudio };
}

// ── WAV encoder ──────────────────────────────────────────────────────────────

function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const samples = buffer.getChannelData(0); // mono — channel 0
  const sampleRate = buffer.sampleRate;
  const numSamples = samples.length;
  const bytesPerSample = 2; // 16-bit
  const dataBytes = numSamples * bytesPerSample;

  const out = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(out);

  // RIFF header
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(view, 8, "WAVE");

  // fmt chunk
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);           // chunk size
  view.setUint16(20, 1, true);            // PCM format
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, sampleRate, true);   // sample rate
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true);              // block align
  view.setUint16(34, 16, true);           // bits per sample

  // data chunk
  writeStr(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  // PCM samples — clamp floats to [-1, 1] then scale to Int16
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return out;
}

function writeStr(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
