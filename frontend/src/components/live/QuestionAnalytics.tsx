"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface QuestionAnalyticsProps {
  analytics: {
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    optionACount: number;
    optionBCount: number;
    optionCCount: number;
    optionDCount: number;
  };
}

export default function QuestionAnalytics({ analytics }: QuestionAnalyticsProps) {
  const data = [
    { name: "A", count: analytics.optionACount, fill: "#8b5cf6" },
    { name: "B", count: analytics.optionBCount, fill: "#ec4899" },
    { name: "C", count: analytics.optionCCount, fill: "#3b82f6" },
    { name: "D", count: analytics.optionDCount, fill: "#10b981" },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 h-full flex flex-col">
      <h3 className="text-white/80 font-medium mb-4">Current Question Answers</h3>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#ffffff60" tick={{fill: '#ffffff60'}} />
            <YAxis stroke="#ffffff60" tick={{fill: '#ffffff60'}} allowDecimals={false} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ backgroundColor: '#1a1a24', borderColor: '#ffffff20', color: '#fff', borderRadius: '12px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-white/10 pt-4">
        <div className="bg-green-500/10 rounded-lg p-2">
          <span className="block text-xs text-green-400/70 uppercase">Correct</span>
          <span className="text-xl font-bold text-green-400">{analytics.correctCount}</span>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2">
          <span className="block text-xs text-red-400/70 uppercase">Wrong</span>
          <span className="text-xl font-bold text-red-400">{analytics.wrongCount}</span>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <span className="block text-xs text-white/50 uppercase">Skipped</span>
          <span className="text-xl font-bold text-white/80">{analytics.skippedCount}</span>
        </div>
      </div>
    </div>
  );
}
