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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [history, setHistory] = useState<
    { timestamp: string; digits: number[] }[]
  >([]);

  useEffect(() => {
    if (!isRunning) return;

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
  }, [isRunning]);

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

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setIsRunning(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Start
        </button>
        <button
          onClick={() => setIsRunning(false)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stop
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Download
        </button>
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
