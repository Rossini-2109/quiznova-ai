"use client";

import React from "react";
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
          questions={questions}
          analysis={questionAnalysis}
          onRemove={handleRemoveParticipant}
        />
      )}
    </>
  );
}