import ChatWindow from "@/components/chat/ChatWindow";
import MeetingCard from "@/components/meetings/MeetingCard";
import SummaryViewer from "@/components/meetings/SummaryViewer";
import UploadPanel from "@/components/meetings/UploadPanel";
import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/ui/EmptyState";
import { useDeleteMeeting, useMeetingDetail, useMeetings } from "@/hooks/useMeetings";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/store/toastStore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, X } from "lucide-react";
import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";

type Tab = "meetings" | "chat";

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: projects = [] } = useProjects();
  const { data: meetings = [], isLoading: meetingsLoading, isError: meetingsError } = useMeetings(slug ?? "");
  const deleteMeeting = useDeleteMeeting(slug ?? "");
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("meetings");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data: selectedMeeting } = useMeetingDetail(slug ?? "", selectedMeetingId ?? "");

  if (!slug) return <Navigate to="/" replace />;

  const project = projects.find((p) => p.slug === slug);

  function handleSummarized(meetingId: string) {
    setSelectedMeetingId(meetingId);
    setShowUpload(false);
  }

  function handleDelete(meetingId: string) {
    const name = meetings.find((m) => m.meeting_id === meetingId)?.original_filename ?? "Meeting";
    deleteMeeting.mutate(meetingId, {
      onSuccess: () => {
        if (selectedMeetingId === meetingId) setSelectedMeetingId(null);
        toast.success(`"${name}" deleted`);
      },
      onError: () => {
        toast.error("Failed to delete meeting");
      },
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar
        title={project?.name ?? slug}
        subtitle={project?.description}
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {(["meetings", "chat"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      />

      {activeTab === "meetings" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Meeting list */}
          <div className="flex w-72 shrink-0 flex-col border-r border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-2xs font-semibold uppercase tracking-widest text-text-muted">
                Meetings
              </span>
              <button
                onClick={() => {
                  setShowUpload(true);
                  setSelectedMeetingId(null);
                }}
                className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-hover"
              >
                <Plus size={11} />
                Upload
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
              {meetingsLoading && (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 skeleton rounded-lg" />
                  ))}
                </div>
              )}

              {!meetingsLoading && meetingsError && (
                <EmptyState
                  icon={Upload}
                  title="Could not load meetings"
                  description="The project was not found or you do not have access. Try logging out and back in."
                />
              )}

              {!meetingsLoading && !meetingsError && meetings.length === 0 && !showUpload && (
                <EmptyState
                  icon={Upload}
                  title="No meetings yet"
                  description="Upload your first recording to get started."
                  action={
                    <button
                      onClick={() => setShowUpload(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      Upload a meeting
                    </button>
                  }
                />
              )}

              {meetings.map((m) => (
                <MeetingCard
                  key={m.meeting_id}
                  meeting={m}
                  isActive={selectedMeetingId === m.meeting_id && !showUpload}
                  onSelect={() => {
                    setSelectedMeetingId(m.meeting_id);
                    setShowUpload(false);
                  }}
                  onDelete={() => handleDelete(m.meeting_id)}
                />
              ))}
            </div>
          </div>

          {/* Main panel */}
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {showUpload ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold text-text-primary">
                      Upload Meeting
                    </h3>
                    <button
                      onClick={() => setShowUpload(false)}
                      className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <UploadPanel slug={slug} onSummarized={handleSummarized} />
                </motion.div>
              ) : selectedMeeting ? (
                <motion.div
                  key={selectedMeeting.meeting_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <SummaryViewer meeting={selectedMeeting} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full items-center justify-center"
                >
                  <p className="text-sm text-text-muted">
                    Select a meeting or upload a new one.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <ChatWindow slug={slug} hasMeetings={meetings.length > 0} />
        </div>
      )}
    </div>
  );
}
