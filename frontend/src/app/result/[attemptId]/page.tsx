"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import styles from './result.module.css';

// Types
interface AttemptResult {
  id: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  timeTakenMilliseconds: number;
  attempt: {
    id: string;
    title: string;
    timeLimit: number;
    questions: Array<{
      id: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
    }>;
  };
}

interface ShareResponse {
  ShareUrl: string;
  Token: string;
}

const fetchAttempt = async (attemptId: string): Promise<AttemptResult> => {
  const { data } = await axios.get(`/api/attempts/${attemptId}`);
  return data;
};

const createShareToken = async (attemptId: string): Promise<ShareResponse> => {
  const { data } = await axios.post(`/api/attempts/share/${attemptId}`);
  return data;
};

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const { data, isLoading, error } = useQuery(['attempt', attemptId], () => fetchAttempt(attemptId!));
  const shareMutation = useMutation(() => createShareToken(attemptId!), {
    onSuccess: (res) => {
      navigator.clipboard.writeText(res.ShareUrl);
      alert('Share link copied to clipboard!');
    },
    onError: () => {
      alert('Failed to create share link');
    },
  });

  if (isLoading) return <div className={styles.loader}>Loading...</div>;
  if (error) return <div className={styles.error}>Error loading result.</div>;

  const attempt = data!;
  const accuracy = attempt.percentage;
  const totalQuestions = attempt.attempt.questions.length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <section className={styles.header}>
        <h1 className={styles.title}>{attempt.attempt.title}</h1>
        <span className={styles.badge}>Completed</span>
        <div className={styles.dates}>
          <p>Started: {new Date(attempt.startedAt).toLocaleString()}</p>
          <p>Submitted: {new Date(attempt.submittedAt).toLocaleString()}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btn}>View Dashboard</button>
          <button className={styles.btn}>Assign Homework</button>
          <button className={styles.btn} onClick={() => shareMutation.mutate()}>Share Report</button>
          <button className={styles.btn}>Export Report</button>
        </div>
      </section>

      {/* Stats Cards */}
      <section className={styles.statsGrid}>
        <div className={styles.card}>
          <div className={styles.icon}>🎯</div>
          <h3>Accuracy</h3>
          <p>{accuracy.toFixed(1)}%</p>
        </div>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h3>Completion Rate</h3>
          <p>{attempt.timeTakenMilliseconds ? 100 : 0}%</p>
        </div>
        <div className={styles.card}>
          <div className={styles.icon}>👥</div>
          <h3>Total Participants</h3>
          <p>1</p>
        </div>
        <div className={styles.card}>
          <div className={styles.icon}>📄</div>
          <h3>Questions</h3>
          <p>{totalQuestions}</p>
        </div>
      </section>

      {/* Tabs */}
      <section className={styles.tabs}>
        <button className={styles.tabActive}>Overview</button>
        <button className={styles.tab}>Participants</button>
        <button className={styles.tab}>Questions</button>
        <button className={styles.tab}>Accommodations</button>
        <button className={styles.tab}>Tags</button>
        <button className={styles.tab}>Anti‑Cheating</button>
      </section>

      {/* Overview Content */}
      <section className={styles.overview}>
        <h2>Score Summary</h2>
        <p>Score: {attempt.score} / {totalQuestions * 5}</p>
        <p>Correct Answers: {attempt.correctAnswers}</p>
        <p>Wrong Answers: {attempt.wrongAnswers}</p>
        <p>Time Taken: {Math.round(attempt.timeTakenMilliseconds / 1000)} seconds</p>
      </section>

      {/* Questions List */}
      <section className={styles.questions}>
        <h2>Questions</h2>
        {attempt.attempt.questions.map((q, idx) => (
          <div key={q.id} className={styles.questionCard}>
            <h4>{idx + 1}. {q.questionText}</h4>
            <ul className={styles.options}>
              <li>A. {q.optionA}</li>
              <li>B. {q.optionB}</li>
              <li>C. {q.optionC}</li>
              <li>D. {q.optionD}</li>
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
