import TeacherLiveSessionPage from "@/components/live-session/TeacherLiveSessionPage";
import api from "@/services/api";

export default async function Page({
  params,
}: {
  params: { sessionId: string };
}) {
  const sessionId = params.sessionId;

  try {
    const [sessionRes, participantsRes, questionsRes, analysisRes] =
      await Promise.all([
        api.get(`/live-session/${sessionId}`),
        api.get(`/live-session/${sessionId}/participants`),
        api.get(`/live-session/${sessionId}/questions`),
        api.get(`/live-session/${sessionId}/analysis`),
      ]);
      const handleAddQuestion = (e: React.FormEvent) => {
  e.preventDefault();

  const newQuestion = {
    id: crypto.randomUUID(),
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    optionE: "",
    correctAnswer: "",
    questionTimeLimit: 10,
    optionCount: 4,
  };

  setQuestions((prev: any) => [...prev, newQuestion]);
};

    return (
      <TeacherLiveSessionPage
        session={sessionRes.data}
        filteredParticipants={participantsRes.data}
        questions={questionsRes.data}
        questionAnalysis={analysisRes.data}
        handleRemoveParticipant={async (id: string) => {
          "use server"; // optional safety hint (ignored if client handler)
          await api.delete(
            `/live-session/${sessionId}/participants/${id}`
          );
        }}
      />
    );
  } catch (err) {
    console.error("Failed to load live session:", err);
    return <div>Failed to load session</div>;
  }
}