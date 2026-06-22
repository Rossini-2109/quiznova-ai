"use client";

import { useState } from "react";

interface Props {
  questions: any[];
  analysis: any[];
}

export default function QuestionsTab({
  questions,
  analysis,
}: Props) {

  const [selected, setSelected] = useState(0);

  const question = questions[selected];

  if (!question) return null;

  return (
    <div className="grid xl:grid-cols-12 gap-6">

      <div className="xl:col-span-4 space-y-2">

        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setSelected(i)}
            className="w-full text-left p-4 rounded-xl bg-white/5"
          >
            Question {i + 1}
          </button>
        ))}

      </div>

      <div className="xl:col-span-8">

        <div className="bg-white/5 rounded-3xl p-6">

          <h3 className="font-bold">
            {question.questionText}
          </h3>

        </div>

      </div>

    </div>
  );
}