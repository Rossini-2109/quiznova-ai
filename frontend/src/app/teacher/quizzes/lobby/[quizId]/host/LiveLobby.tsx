// frontend/src/app/teacher/quizzes/lobby/[quizId]/host/LiveLobby.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./LiveLobby.module.css";
import { QRCodeCanvas } from "qrcode.react";
import toast, { Toaster } from "react-hot-toast";
import api from "@/services/api";
import { io, Socket } from "socket.io-client";

// Types
interface Participant {
  id: string;
  name: string;
  avatarColor?: string;
  joinedAt: string; // ISO string
}

interface QuizInfo {
  id: string;
  title: string;
  totalQuestions: number;
  timePerQuestion: number; // seconds
}

export default function LiveLobby() {
  const router = useRouter();
  const { quizId } = useParams() as { quizId: string };

  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [started, setStarted] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [duration, setDuration] = useState(0); // seconds elapsed

  // Helper: format time
  const formatTime = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Helper: copy to clipboard with toast
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  // Load static quiz info once
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/quizzes/${quizId}/info`);
        setQuizInfo(res.data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load quiz info");
      }
    })();
  }, [quizId]);

  // Initialise WebSocket for real‑time updates
  useEffect(() => {
    const sock = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/lobby/${quizId}`);
    setSocket(sock);

    sock.on("participant_joined", (p: Participant) => {
      setParticipants((prev) => [...prev, p]);
      toast.success(`🎉 ${p.name} joined`);
    });
    sock.on("participant_left", (id: string) => {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      toast(`⚡ participant left`);
    });
    sock.on("lobby_started", () => {
      setStarted(true);
    });
    return () => {
      sock.disconnect();
    };
  }, [quizId]);

  // Redirect when lobby starts
  useEffect(() => {
    if (started) {
      router.push(`/teacher/quizzes/${quizId}/live`);
    }
  }, [started, router, quizId]);

  // Lobby timer
  useEffect(() => {
    const int = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(int);
  }, []);

  // Action handlers
  const handlePause = async () => {
    try {
      await api.post(`/lobby/${quizId}/pause`);
      toast.success("Lobby paused");
    } catch (e) {
      toast.error("Failed to pause lobby");
    }
  };

  const handleEnd = async () => {
    try {
      await api.post(`/lobby/${quizId}/end`);
      router.push("/teacher/dashboard");
    } catch (e) {
      toast.error("Failed to end lobby");
    }
  };

  const handleStart = async () => {
    try {
      await api.post(`/lobby/${quizId}/start`);
      // server will emit lobby_started, which triggers redirect
    } catch (e) {
      toast.error("Failed to start quiz");
    }
  };

  // Derived values
  const joinCode = quizId.toUpperCase();
  const joinUrl = `${window.location.origin}/student/quiz/join/${joinCode}`;

  // Render participant row
  const renderParticipant = (p: Participant) => (
    <div key={p.id} className={styles.participantRow}>
      <div className={styles.avatar} style={{ backgroundColor: p.avatarColor || "var(--primary)" }}>
        {p.name.charAt(0).toUpperCase()}
      </div>
      <div className={styles.partInfo}>
        <span className={styles.partName}>{p.name}</span>
        <span className={styles.partTime}>Joined {new Date(p.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <span className={styles.onlineDot} />
    </div>
  );

  return (
    <div className={styles.body}>
      <Toaster position="top-right" />
      {/* Header */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.logoIcon} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>QuizNova AI</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.8, color: "var(--text-primary)" }}>Live Session Lobby</div>
          </div>
        </div>
        <div className={styles.statusCenter}>
          <div className={styles.pulseGreen} />
          <span>Waiting For Participants</span>
        </div>
        <div className={styles.headerRight}>
          <button className={`${styles.pillButton} ${styles.pauseBtn}`} onClick={handlePause}>Pause Session</button>
          <button className={`${styles.pillButton} ${styles.endBtn}`} onClick={handleEnd}>End Quiz</button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Left Column */}
        <section className={styles.leftColumn}>
          {/* Quiz Info Card */}
          {quizInfo && (
            <div className={styles.glassCard}>
              <h1 className={styles.title}>{quizInfo.title}</h1>
              <p className={styles.subtitle}>Participants can join using the code below</p>
              <div className={styles.statsRow}>
                <div className={styles.badge}>Questions: {quizInfo.totalQuestions}</div>
                <div className={styles.badge}>Time/Q: {quizInfo.timePerQuestion}s</div>
                <div className={styles.badge}>Participants: {participants.length}</div>
                <div className={styles.badge}>Status: {started ? "Live" : "Waiting"}</div>
              </div>
            </div>
          )}

          {/* Join Code Section */}
          <div className={styles.joinCard}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>How Students Can Join</h2>
            <div className={styles.joinCode}>
              {joinCode}
              <button className={styles.copyBtn} onClick={() => copyToClipboard(joinCode, "Join code")}>Copy</button>
            </div>
          </div>

          {/* Join Link Section */}
          <div className={styles.linkCard}>
            <label>Join Link</label>
            <input readOnly className={styles.linkInput} value={joinUrl} />
            <div className={styles.linkActions}>
              <button className={`${styles.linkBtn} ${styles.copyLinkBtn}`} onClick={() => copyToClipboard(joinUrl, "Join link")}>Copy Link</button>
              <button className={`${styles.linkBtn} ${styles.shareLinkBtn}`} onClick={() => navigator.share?.({ url: joinUrl })}>Share Link</button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className={styles.qrCard}>
            <div className={styles.qrTitle}>Scan QR Code</div>
            <div className={styles.qrWrapper}>
              <QRCodeCanvas value={joinUrl} size={300} bgColor="#ffffff" fgColor="#000000" level="Q" />
            </div>
            <div style={{ marginTop: "0.5rem" }}>Join Code: {joinCode}</div>
            <button className={styles.copyBtn} onClick={() => copyToClipboard(joinCode, "Join code")}>Copy</button>
          </div>
        </section>

        {/* Right Column - Participants */}
        <section className={styles.rightColumn}>
          <div className={styles.participantsPanel}>
            <div className={styles.participantsHeader}>
              <span>Participants</span>
              <span className={styles.pulseGreen} />
              <span>{participants.length} Joined</span>
            </div>
            <div className={styles.participantList}>
              {participants.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No participants yet</p>
                  <p>Share the code, link, or QR code to invite students</p>
                </div>
              ) : (
                participants.map(renderParticipant)
              )}
            </div>
            <div className={styles.statsFooter}>
              <div>Total Joined: {participants.length}</div>
              <div>Ready: {participants.length}</div>
              <div>Pending: 0</div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${participants.length * 5}%` }} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <footer className={styles.bottomBar}>
        <div className={styles.timer}>Lobby Duration: {formatTime(duration)}</div>
        <div className={styles.counter}>Participants: {participants.length} / Unlimited</div>
        <button className={styles.startBtn} onClick={handleStart} disabled={participants.length === 0}>
          <span className={styles.rocket}>🚀</span> Start Live Quiz
        </button>
      </footer>
    </div>
  );
}
