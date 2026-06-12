import * as signalR from "@microsoft/signalr";

export const connection =
  new signalR.HubConnectionBuilder()
      .withUrl(
        "https://localhost:5201/quizHub"
      )
    .withAutomaticReconnect()
    .build();