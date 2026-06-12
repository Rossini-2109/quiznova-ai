"use client";

import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";

export default function JoinPage() {
  useEffect(() => {
    const connect = async () => {
      const connection =
        new signalR.HubConnectionBuilder()
          .withUrl(
            "https://localhost:5201/quizHub"
          )
          .withAutomaticReconnect()
          .build();

      try {
        await connection.start();

        console.log(
          "Connected to QuizHub"
        );
      } catch (err) {
        console.error(err);
      }
    };

    connect();
  }, []);

  return (
    <div>
      Student Lobby
    </div>
  );
}