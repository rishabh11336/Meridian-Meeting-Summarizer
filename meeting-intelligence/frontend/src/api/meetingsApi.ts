import type {
  CorrectionRequest,
  MeetingDetail,
  MeetingListResponse,
  MeetingMeta,
  SummarizeRequest,
  SummarizeResponse,
  TranscriptionResult,
} from "@/types/meeting";
import client from "./client";

export async function listMeetings(slug: string): Promise<MeetingListResponse> {
  const { data } = await client.get<MeetingListResponse>(`/projects/${slug}/meetings`);
  return data;
}

export async function getMeeting(slug: string, meetingId: string): Promise<MeetingDetail> {
  const { data } = await client.get<MeetingDetail>(`/projects/${slug}/meetings/${meetingId}`);
  return data;
}

export async function uploadMeeting(
  slug: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append("video", file);
  const { data } = await client.post<TranscriptionResult>(
    `/projects/${slug}/meetings/upload`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    },
  );
  return data;
}

export async function summarizeMeeting(
  slug: string,
  meetingId: string,
  payload: SummarizeRequest,
): Promise<SummarizeResponse> {
  const { data } = await client.post<SummarizeResponse>(
    `/projects/${slug}/meetings/${meetingId}/summarize`,
    payload,
  );
  return data;
}

export async function saveCorrection(
  slug: string,
  meetingId: string,
  payload: CorrectionRequest,
): Promise<MeetingMeta> {
  const { data } = await client.patch<MeetingMeta>(
    `/projects/${slug}/meetings/${meetingId}/correction`,
    payload,
  );
  return data;
}

export async function deleteMeeting(slug: string, meetingId: string): Promise<void> {
  await client.delete(`/projects/${slug}/meetings/${meetingId}`);
}
