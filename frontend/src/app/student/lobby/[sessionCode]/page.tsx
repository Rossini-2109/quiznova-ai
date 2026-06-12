"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation";
import * as signalR from "@microsoft/signalr"
import { Users, Loader2 } from "lucide-react"

export default function LobbyPage() {
  const router = useRouter();

  const params = useParams();
  const sessionCode = params.sessionCode as string;
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null)
  
  // Registration State
  const [isRegistered, setIsRegistered] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [empIdInput, setEmpIdInput] = useState("");
  const [studentName, setStudentName] = useState<string>("")
  
  // Lobby State
  const [participants, setParticipants] = useState<string[]>([])

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !empIdInput.trim()) {
      alert("Please enter both Name and Employee ID/PS Number");
      return;
    }
    const combinedName = `${nameInput.trim()} (${empIdInput.trim()})`;
    setStudentName(combinedName);
    setIsRegistered(true);
  };

  // Establish SignalR connection after registration
  useEffect(() => {
    if (!isRegistered || !studentName) return

    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/quizHub`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
        accessTokenFactory: () => ""
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()

    hubConnection.start()
      .then(() => {
        hubConnection.invoke("JoinSession", sessionCode, studentName)
      })
      .catch(err => console.error("SignalR connection error:", err))

    hubConnection.on("ParticipantListUpdated", (list) => {
      setParticipants(list);
    });
    
    hubConnection.on("StudentJoined", (newName) => {
      setParticipants((prev) => Array.from(new Set([...prev, newName])));
    });
    
    hubConnection.on("QuizStarted", () => {
      router.push(`/student/quiz/${sessionCode}`);
    });

    setConnection(hubConnection)
    return () => {
      hubConnection.stop()
    }
  }, [isRegistered, studentName, sessionCode, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 p-4 text-white relative">
      
      {/* Registration Modal Overlay */}
      {!isRegistered && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white/10 border border-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Join Quiz</h2>
              <p className="text-zinc-400 text-sm">Session: <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{sessionCode}</span></p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Employee ID / PS Number</label>
                <input 
                  type="text" 
                  required
                  value={empIdInput}
                  onChange={e => setEmpIdInput(e.target.value)}
                  placeholder="e.g. EMP12345"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
              >
                Join Lobby
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Lobby View */}
      <div className={`bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center transition-all duration-500 ${!isRegistered ? 'opacity-20 blur-sm scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">
          Waiting Room
        </h1>
        <p className="text-zinc-400 mb-6 font-mono bg-black/20 py-1.5 px-3 rounded-lg inline-block">Code: {sessionCode}</p>
        
        {isRegistered && (
          <p className="mb-8 text-sm">Joined as: <span className="font-bold text-indigo-300 block text-lg mt-1">{studentName}</span></p>
        )}
        
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
          {/* Subtle gradient glow inside the participants box */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <h2 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Participants ({participants.length})
          </h2>
          
          <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar px-2">
            {participants.length === 0 ? (
              <li className="text-zinc-500 text-sm italic py-4">Waiting for others...</li>
            ) : (
              participants.map((p, i) => (
                <li key={`${p}-${i}`} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 text-left flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                    {p.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{p}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        
        <div className="mt-8 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <p className="text-indigo-200/60 text-sm font-medium">Waiting for the teacher to start the quiz...</p>
        </div>
      </div>
    </div>
  )
}
