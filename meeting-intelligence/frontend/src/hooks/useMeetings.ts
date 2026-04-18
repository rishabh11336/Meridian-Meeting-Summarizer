import {
  deleteMeeting,
  getMeeting,
  listMeetings,
  saveCorrection,
  summarizeMeeting,
  uploadMeeting,
} from "@/api/meetingsApi";
import type { CorrectionRequest, SummarizeRequest } from "@/types/meeting";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMeetings(slug: string) {
  return useQuery({
    queryKey: ["meetings", slug],
    queryFn: () => listMeetings(slug),
    select: (data) => data.meetings,
    enabled: !!slug,
  });
}

export function useMeetingDetail(slug: string, meetingId: string) {
  return useQuery({
    queryKey: ["meeting", slug, meetingId],
    queryFn: () => getMeeting(slug, meetingId),
    enabled: !!slug && !!meetingId,
  });
}

export function useUploadMeeting(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => uploadMeeting(slug, file, onProgress),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["meetings", slug] });
      void qc.invalidateQueries({ queryKey: ["storage"] });
    },
  });
}

export function useSummarizeMeeting(slug: string, meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SummarizeRequest) => summarizeMeeting(slug, meetingId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["meetings", slug] });
      void qc.invalidateQueries({ queryKey: ["meeting", slug, meetingId] });
    },
  });
}

export function useSaveCorrection(slug: string, meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CorrectionRequest) => saveCorrection(slug, meetingId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["meeting", slug, meetingId] });
    },
  });
}

export function useDeleteMeeting(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => deleteMeeting(slug, meetingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["meetings", slug] });
      void qc.invalidateQueries({ queryKey: ["storage"] });
    },
  });
}
