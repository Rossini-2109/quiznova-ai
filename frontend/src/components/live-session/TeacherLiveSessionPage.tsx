"use client";

import React, { useState } from "react";
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
  // Local state for questions
  const [localQuestions, setLocalQuestions] = useState<any[]>(questions || []);

  const generateUUID = () => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleAddQuestion = () => {
    setLocalQuestions((prev) => [
      ...prev,
      {
        id: generateUUID(),
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
          questions={localQuestions}
          analysis={questionAnalysis}
          onRemove={handleRemoveParticipant}
          onAddQuestion={handleAddQuestion}
        />
      )}
    </>
  );
}