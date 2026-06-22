import TeacherLiveSessionPage from "@/components/live-session/TeacherLiveSessionPage";
import api from "@/services/api";

export default async function Page({
  params,
}: {
  params: { sessionId: string };
}) {
  const sessionId = params.sessionId;

  const sessionRes = await api.get(`/live-session/${sessionId}`);
  const participantsRes = await api.get(`/live-session/${sessionId}/participants`);
  const questionsRes = await api.get(`/live-session/${sessionId}/questions`);
  const analysisRes = await api.get(`/live-session/${sessionId}/analysis`);

  return (
    <TeacherLiveSessionPage
      session={sessionRes.data}
      filteredParticipants={participantsRes.data}
      questions={questionsRes.data}
      questionAnalysis={analysisRes.data}
      handleRemoveParticipant={async (id: string) => {
        await api.delete(`/live-session/${sessionId}/participants/${id}`);
      }}
    />
  );
}