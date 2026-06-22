"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import LobbyView from "./LobbyView";
import LiveDashboard from "./LiveDashboard";

interface Props {
  session: any;
  filteredParticipants: any[];
  questions: any[];
  questionAnalysis: any;
  handleRemoveParticipant: (id: string) => void;
}

export default function TeacherLiveSessionPage({
  session,
  filteredParticipants,
  questions,
  questionAnalysis,
  handleRemoveParticipant,
}: Props) {
  // ✅ Local state for questions
  const [localQuestions, setLocalQuestions] = useState<any[]>([]);

  // sync props → state when session loads/changes
  useEffect(() => {
    setLocalQuestions(questions || []);
  }, [questions]);

  // ✅ Add question handler
  const handleAddQuestion = () => {
    setLocalQuestions((prev) => [
      ...prev,
      {
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
      },
    ]);
  };

  return (
    <>
      <Header />

      {!session?.isStarted ? (
        <LobbyView
          session={session}
          participants={filteredParticipants}
          onRemove={handleRemoveParticipant}
        />
      ) : (
        <LiveDashboard
          participants={filteredParticipants}
          questions={localQuestions}   {/* ✅ IMPORTANT FIX */}
          analysis={questionAnalysis}
          onRemove={handleRemoveParticipant}
          onAddQuestion={handleAddQuestion} {/* optional but useful */}
        />
      )}
    </>
  );
}