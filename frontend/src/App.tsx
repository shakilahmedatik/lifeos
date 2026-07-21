import { useEffect, useState } from "react";

interface HealthStatus {
  status: string;
  port: number;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError("Disconnected"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">LifeOS</h1>
        {error ? (
          <p className="text-red-400">{error}</p>
        ) : health ? (
          <p className="text-green-400">Connected (port {health.port})</p>
        ) : (
          <p className="text-gray-400">Loading...</p>
        )}
      </div>
    </div>
  );
}
