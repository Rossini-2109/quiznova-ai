"use client";

import * as signalR from "@microsoft/signalr";

const HUB_URL =
  `${
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ??
    "https://quiznova-ai-grdq.onrender.com"
  }/quizHub`;

let connection: signalR.HubConnection | null = null;

let startingPromise: Promise<void> | null = null;

function createConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}

export function getConnection() {
  if (!connection) {
    connection = createConnection();

    connection.onclose((err) => {
      console.warn("SignalR Closed", err);
    });

    connection.onreconnecting((err) => {
      console.warn("SignalR Reconnecting", err);
    });

    connection.onreconnected((id) => {
      console.log("SignalR Reconnected", id);
    });
  }

  return connection;
}

const MAX_RETRIES = 2;

async function startHubWithRetry() {
  const conn = getConnection();

  if (
    conn.state === signalR.HubConnectionState.Connected
  ) {
    return;
  }

  if (
    conn.state === signalR.HubConnectionState.Connecting ||
    conn.state === signalR.HubConnectionState.Reconnecting
  ) {
    if (startingPromise) {
      await startingPromise;
    }
    return;
  }

  let attempts = 0;

  startingPromise = (async () => {
    while (attempts <= MAX_RETRIES) {
      try {
        await conn.start();

        console.log("SignalR Connected");

        return;
      } catch (err) {
        attempts++;

        if (attempts > MAX_RETRIES) {
          throw err;
        }

        console.warn(
          `SignalR start attempt ${attempts} failed`,
          err
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
      }
    }
  })();

  try {
    await startingPromise;
  } finally {
    startingPromise = null;
  }
}

export async function startConnection(
  sessionCode: string,
  studentName: string,
  employeeId: string = ""
) {
  try {
    const conn = getConnection();

    await startHubWithRetry();

    if (
      conn.state === signalR.HubConnectionState.Connected
    ) {
      await conn.invoke(
        "JoinSession",
        sessionCode,
        studentName,
        employeeId
      );
    }
  } catch (err) {
    console.error("SignalR Start Error", err);
  }
}

export async function stopConnection() {
  try {
    const conn = getConnection();

    if (
      conn.state === signalR.HubConnectionState.Connected ||
      conn.state === signalR.HubConnectionState.Reconnecting
    ) {
      await conn.stop();

      console.log("SignalR Disconnected");
    }
  } catch (err) {
    console.warn("SignalR stop skipped", err);
  }
}

export const startQuiz = (sessionCode: string) =>
  getConnection().invoke(
    "TeacherStartedQuiz",
    sessionCode
  );

export const pauseQuiz = (sessionCode: string) =>
  getConnection().invoke(
    "TeacherPausedQuiz",
    sessionCode
  );

export const resumeQuiz = (sessionCode: string) =>
  getConnection().invoke(
    "TeacherResumedQuiz",
    sessionCode
  );

export const nextQuestion = (sessionCode: string) =>
  getConnection().invoke(
    "TeacherMovedToQuestion",
    sessionCode,
    1
  );

export const previousQuestion = (sessionCode: string) =>
  getConnection().invoke(
    "TeacherMovedToQuestion",
    sessionCode,
    -1
  );

export const jumpToQuestion = (
  sessionCode: string,
  index: number
) =>
  getConnection().invoke(
    "TeacherJumpedToQuestion",
    sessionCode,
    index
  );

export const endQuiz = (sessionCode: string) =>
  getConnection().invoke(
    "TeacherEndedQuiz",
    sessionCode
  );

export const reportSuspicion = (
  sessionCode: string,
  studentName: string,
  activityType: string
) =>
  getConnection().invoke(
    "ReportSuspiciousActivity",
    sessionCode,
    studentName,
    activityType
  );

export const updateCurrentQuestion = (
  sessionCode: string,
  studentName: string,
  questionIndex: number
) =>
  getConnection().invoke(
    "UpdateCurrentQuestion",
    sessionCode,
    studentName,
    questionIndex
  );

export default getConnection;