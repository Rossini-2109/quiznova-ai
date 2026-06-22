"use client";

import { useState } from "react";
import LeaderboardTab from "./LeaderboardTab";
import QuestionsTab from "./QuestionsTab";
import AntiCheatTab from "./AntiCheatTab";
import ParticipantSidebar from "./ParticipantSidebar";

export default function LiveDashboard(props: any) {

  const [activeTab, setActiveTab] =
    useState("leaderboard");

  return (
    <div className="flex flex-1 overflow-hidden">

      <main className="flex-1 p-6">

        {activeTab === "leaderboard" && (
          <LeaderboardTab
            participants={props.participants}
            onRemove={props.onRemove}
          />
        )}

        {activeTab === "questions" && (
          <QuestionsTab
            questions={props.questions}
            analysis={props.analysis}
          />
        )}

        {activeTab === "anticheat" && (
          <AntiCheatTab
            participants={props.participants}
          />
        )}

      </main>

      <ParticipantSidebar
        participants={props.participants}
      />

    </div>
  );
}