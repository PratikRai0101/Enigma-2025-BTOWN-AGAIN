"use client";

import { useState, useEffect } from "react";
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
import * as XLSX from "xlsx";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import ForgotPassword from "@/components/ForgotPassword";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import axios from "axios";

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

export default function LiveDisplaySystem() {
  const [digits, setDigits] = useState(Array(12).fill(0));
  const [chartData, setChartData] = useState({
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
  const [isRunning, setIsRunning] = useState(false);
  const [intervalTime, setIntervalTime] = useState(1000);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [history, setHistory] = useState<
    { timestamp: string; digits: number[] }[]
  >([]);
  const [pendingData, setPendingData] = useState<
    { timestamp: string; digits: number[] }[]
  >([]);
  const [anomalies, setAnomalies] = useState<string[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!isRunning || !isAuthenticated) return;

    const interval = setInterval(() => {
      const newDigits = Array.from({ length: digits.length }, () =>
        Math.floor(Math.random() * 10)
      );

      const currentTime = new Date().toLocaleTimeString();

      setDigits(newDigits);

      const newEntry = { timestamp: currentTime, digits: newDigits };
      setPendingData((prev) => [...prev, newEntry]);

      setHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, newEntry];
        return updatedHistory.slice(-100);
      });

      setChartData((prevData) => ({
        labels: [...prevData.labels, currentTime].slice(-20),
        datasets: [
          {
            ...prevData.datasets[0],
            data: [
              ...prevData.datasets[0].data,
              newDigits.reduce((a, b) => a + b, 0) / newDigits.length,
            ].slice(-20),
          },
        ],
      }));

      detectAnomalies(newDigits);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isRunning, isAuthenticated, digits.length, intervalTime]);

  const anomalyDetection = (digits: number[]): string[] => {
    const digitCounts: { [key: number]: number } = {};
    digits.forEach((digit) => {
      digitCounts[digit] = (digitCounts[digit] || 0) + 1;
    });

    return Object.entries(digitCounts)
      .filter(([_, count]) => count > 3)
      .map(([digit, count]) => `Digit ${digit} is repeated ${count} times`);
  };

  const detectAnomalies = (newDigits: number[]) => {
    const anomalies = anomalyDetection(newDigits);
    if (anomalies.length > 0) {
      setAnomalies((prev) => [
        ...prev,
        `Anomalies detected at ${new Date().toLocaleTimeString()}`,
      ]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || pendingData.length === 0) return;

    const sendPendingData = async () => {
      try {
        await axios.post(
          "/api/store-data",
          { digits: pendingData },
          {
            headers: {
              "x-api-key": process.env.API_KEY,
            },
          }
        );
        setPendingData([]);
      } catch (error) {
        console.error("Failed to send data:", error);
      }
    };

    const interval = setInterval(sendPendingData, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, pendingData]);

  const handleDownload = () => {
    const excelData = history.map((entry) => {
      const anomalies = anomalyDetection(entry.digits);
      return {
        Timestamp: entry.timestamp,
        ...entry.digits.reduce((acc, digit, index) => {
          acc[`Digit ${index + 1}`] = digit;
          return acc;
        }, {} as Record<string, number>),
        Anomalies: anomalies.join(", "),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Live Data");
    XLSX.writeFile(workbook, "LiveDisplayData.xlsx");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Live Display Data",
      },
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-sm mx-auto p-4">
        {showForgotPassword ? (
          <ForgotPassword
            onReset={() => setShowForgotPassword(false)}
            onSwitch={() => setShowForgotPassword(false)}
          />
        ) : showSignUp ? (
          <SignUp
            onSignUp={() => setIsAuthenticated(true)}
            onSwitch={() => setShowSignUp(false)}
            onForgotPassword={() => setShowForgotPassword(true)}
          />
        ) : (
          <SignIn
            onSignIn={() => setIsAuthenticated(true)}
            onSwitch={() => setShowSignUp(true)}
            onForgotPassword={() => setShowForgotPassword(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={handleSignOut} className="bg-red-500 text-white">
          Sign Out
        </Button>
        <div className="space-x-4">
          <Button
            onClick={() => setIsRunning(true)}
            className="bg-green-500 text-white"
          >
            Start
          </Button>
          <Button
            onClick={() => setIsRunning(false)}
            className="bg-red-500 text-white"
          >
            Stop
          </Button>
          <Button onClick={handleDownload} className="bg-blue-500 text-white">
            Download
          </Button>
          <Button
            onClick={() => {
              setHistory([]);
              setChartData({
                labels: [],
                datasets: [
                  {
                    label: "Average Value",
                    data: [],
                    borderColor: "rgb(75, 192, 192)",
                    tension: 0.1,
                  },
                ],
              });
            }}
            className="bg-yellow-500 text-white"
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <label className="flex items-center space-x-2">
          <span>Interval (ms):</span>
          <input
            type="number"
            min="500"
            step="500"
            value={intervalTime}
            onChange={(e) => {
              const value = Math.max(500, parseInt(e.target.value, 10));
              setIsRunning(false);
              setIntervalTime(value);
              setIsRunning(true);
            }}
            className="border p-1 rounded"
          />
        </label>
        <label className="flex items-center space-x-2">
          <span>Digits:</span>
          <input
            type="number"
            min="1"
            max="20"
            value={digits.length}
            onChange={(e) => {
              const value = Math.max(
                1,
                Math.min(20, parseInt(e.target.value, 10))
              );
              setDigits(Array(value).fill(0));
            }}
            className="border p-1 rounded"
          />
        </label>
      </div>
      <div className="flex flex-wrap justify-center space-x-2 mb-8">
        {digits.map((digit, index) => (
          <div
            key={index}
            className={`w-12 h-16 flex items-center justify-center text-2xl font-bold rounded shadow transition-transform transform duration-300 ${
              digit > 7
                ? "bg-green-200 text-green-700 scale-110"
                : digit < 3
                ? "bg-red-200 text-red-700 scale-90"
                : "bg-gray-200 text-gray-800 scale-100"
            }`}
          >
            {digit}
          </div>
        ))}
      </div>
      <Line options={chartOptions} data={chartData} />
      <div className="mt-8">
        <h2 className="text-xl font-bold">Anomalies</h2>
        <ul>
          {anomalies.map((anomaly, index) => (
            <li key={index} className="text-red-500">
              {anomaly}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
