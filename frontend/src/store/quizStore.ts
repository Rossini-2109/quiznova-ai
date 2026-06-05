import { create } from "zustand";

type QuizStore = {
  answers: Record<string, string>;

  saveAnswer: (
    questionId: string,
    answer: string
  ) => void;

  clearAnswers: () => void;
};

export const useQuizStore =
  create<QuizStore>((set) => ({
    answers: {},

    saveAnswer: (
      questionId,
      answer
    ) =>
      set((state) => ({
        answers: {
          ...state.answers,
          [questionId]: answer,
        },
      })),

    clearAnswers: () => set({ answers: {} }),
  }));