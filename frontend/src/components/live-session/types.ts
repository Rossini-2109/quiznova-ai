export interface SessionState {
  id: string;
  sessionCode: string;
  quizId: string;
  title: string;
  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
}

export interface Participant {
  id: string;
  name: string;
  employeeId: string;
  isConnected: boolean;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  averageTimeTakenMs: number;
  suspicionScore: number;
  rank: number;
  tabSwitchCount: number;
  windowBlurCount: number;
  copyAttempts: number;
  currentQuestionIndex: number;
}

/**
 * SINGLE SOURCE OF TRUTH for theme type
 */
export type ThemeType =
  | "dark-purple"
  | "dark-blue"
  | "neon-green"
  | "cyber-red"
  | "ocean";