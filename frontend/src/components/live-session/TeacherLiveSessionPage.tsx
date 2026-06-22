return (
  <>
    <Header />

    {!session.isStarted ? (
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