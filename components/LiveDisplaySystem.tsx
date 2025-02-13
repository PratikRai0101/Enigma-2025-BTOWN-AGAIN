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
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [history, setHistory] = useState<
    { timestamp: string; digits: number[] }[]
  >([]);

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
      const newDigits = Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 10)
      );

      const currentTime = new Date().toLocaleTimeString();

      setDigits(newDigits);

      setHistory((prevHistory) => [
        ...prevHistory,
        { timestamp: currentTime, digits: newDigits },
      ]);

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
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isAuthenticated]);

  const handleDownload = () => {
    const excelData = history.map((entry) => ({
      Timestamp: entry.timestamp,
      ...entry.digits.reduce((acc, digit, index) => {
        acc[`Digit ${index + 1}`] = digit;
        return acc;
      }, {} as Record<string, number>),
    }));

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
        {showSignUp ? (
          <SignUp
            onSignUp={() => setIsAuthenticated(true)}
            onSwitch={() => setShowSignUp(false)}
          />
        ) : (
          <SignIn
            onSignIn={() => setIsAuthenticated(true)}
            onSwitch={() => setShowSignUp(true)}
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
        </div>
      </div>
      <div className="flex flex-wrap justify-center space-x-2 mb-8">
        {digits.map((digit, index) => (
          <div
            key={index}
            className={`w-12 h-16 flex items-center justify-center text-2xl font-bold rounded shadow ${
              digit > 7
                ? "bg-green-200 text-green-700"
                : digit < 3
                ? "bg-red-200 text-red-700"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {digit}
          </div>
        ))}
      </div>
      <Line options={chartOptions} data={chartData} />
    </div>
  );
}
