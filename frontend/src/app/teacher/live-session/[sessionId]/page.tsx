import TeacherLiveSessionPage from "@/components/live-session/TeacherLiveSessionPage";
import api from "@/services/api";

export default async function Page({
  params,
}: {
  params: { sessionId: string };
}) {
  const sessionId = params.sessionId;

  const [sessionRes, participantsRes, questionsRes, analysisRes] =
    await Promise.all([
      api.get(`/live-session/${sessionId}`),
      api.get(`/live-session/${sessionId}/participants`),
      api.get(`/live-session/${sessionId}/questions`),
      api.get(`/live-session/${sessionId}/analysis`),
    ]);

  return (
    <TeacherLiveSessionPage
      session={sessionRes.data}
      filteredParticipants={participantsRes.data}
      questions={questionsRes.data}
      questionAnalysis={analysisRes.data}
      handleRemoveParticipant={async (id: string) => {
        await api.delete(
          `/live-session/${sessionId}/participants/${id}`
        );
      }}
    />
  );
}