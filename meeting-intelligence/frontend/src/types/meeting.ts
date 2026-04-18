export interface MeetingMeta {
  meeting_id: string;
  original_filename: string;
  uploaded_at: string;
  duration_seconds: number;
  has_summary: boolean;
  has_correction: boolean;
}

export interface MeetingDetail extends MeetingMeta {
  summary: string;
  transcript_raw: string;
  transcript_corrected: string | null;
}

export interface MeetingListResponse {
  meetings: MeetingMeta[];
}

export interface TranscriptionResult {
  meeting_id: string;
  transcript: string;
  duration_seconds: number;
}

export interface SummarizeRequest {
  transcript: string;
  use_correction: boolean;
}

export interface SummarizeResponse {
  meeting_id: string;
  summary: string;
}

export interface CorrectionRequest {
  corrected_text: string;
}
