"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { createClient } from "@supabase/supabase-js";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const supabaseUrl = "https://lliemhskmctauvmbqzdi.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaWVtaHNrbWN0YXV2bWJxemRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0Mjg3MzIsImV4cCI6MjA1NTAwNDczMn0.dZ_93DKDL7b-Vww9FTt2uIaOZdwWN-L-zI4uRkaER7M";
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
const socket = io("http://localhost:5000");

export default function Dashboard() {
  const [data, setData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: "Average Value",
        data: [] as number[],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = async () => {
    setSignInError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setSignInError(error.message);
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      setSignInError("An error occurred during sign-in.");
    }
  };

  const handleSignUp = async () => {
    setSignUpError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setSignUpError(error.message);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setSignUpError(signInError.message);
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            setIsAuthenticated(true);
          }
        }
      }
    } catch (error) {
      console.error("Sign-up error:", error);
      setSignUpError("An error occurred during sign-up.");
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Chart.js Line Chart",
      },
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {!isAuthenticated ? (
        <div className="text-center">
          <h2>Sign In</h2>
          {signInError && <p style={{ color: "red" }}>{signInError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignIn}>Sign In</button>

          <h2>Sign Up</h2>
          {signUpError && <p style={{ color: "red" }}>{signUpError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignUp}>Sign Up</button>
        </div>
      ) : isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div>
          <Line options={options} data={data} />
          {/* ... anomalies display */}
        </div>
      )}
    </div>
  );
}
