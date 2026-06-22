import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function StudentLobbyPage() {
  const router = useRouter();
  const { quizId } = useParams() as { quizId: string };
  const [status, setStatus] = useState<'waiting' | 'started' | 'error'>('waiting');

  // Poll the backend for lobby status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/lobby/${quizId}/status`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (data.started) {
          setStatus('started');
          clearInterval(interval);
          // Redirect student to the actual quiz page
          router.push(`/student/quizzes/${quizId}/take`);
        }
      } catch (e) {
        console.error(e);
        setStatus('error');
        clearInterval(interval);
      }
    }, 3000); // poll every 3 seconds

    return () => clearInterval(interval);
  }, [quizId, router]);

  return (
    <div style={styles.container}>
      {status === 'waiting' && (
        <>
          <h2 style={styles.title}>Waiting for the teacher to start the live session...</h2>
          <p style={styles.info}>Quiz Code: {quizId}</p>
        </>
      )}
      {status === 'error' && (
        <p style={styles.error}>Failed to connect to the lobby. Please try refreshing.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff, #dcd6f7)',
    fontFamily: `'Inter', sans-serif`,
  },
  title: {
    fontSize: '1.8rem',
    color: '#333',
    marginBottom: '1rem',
  },
  info: {
    fontSize: '1.2rem',
    color: '#555',
  },
  error: {
    color: '#e53935',
    fontSize: '1.2rem',
  },
};
