"use client";

import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";

export default function TestPage() {
  useEffect(() => {
    const start = async () => {
      try {
        const connection =
          new signalR.HubConnectionBuilder()
            .withUrl(
              "https://quiznova-ai-grdq.onrender.com/quizHub"
            )
            .withAutomaticReconnect()
            .build();

        await connection.start();

        console.log(
          "✅ Connected to SignalR"
        );
      } catch (err) {
        console.error(
          "❌ SignalR Error",
          err
        );
      }
    };

    start();
  }, []);

  return (
    <div className="p-10">
      SignalR Test
    </div>
  );
}