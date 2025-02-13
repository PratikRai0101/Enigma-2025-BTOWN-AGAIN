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

const supabase = createClient("SUPABASE_URL", "SUPABASE_ANON_KEY");
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
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication state
  const [anomalies, setAnomalies] = useState<string[]>([]); // Track detected anomalies

  useEffect(() => {
    const checkAuth = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        console.error("User is not authenticated");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchHistoricalData() {
      try {
        const { data: rows, error } = await supabase
          .from("display_data")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(20);

        if (error) throw error;

        const labels = rows.map((row) =>
          new Date(row.timestamp).toLocaleTimeString()
        );
        const averages = rows.map(
          (row) =>
            JSON.parse(row.data).reduce((a: number, b: number) => a + b, 0) / 12
        );

        setData({
          labels: labels.reverse(),
          datasets: [
            {
              ...data.datasets[0],
              data: averages.reverse(),
            },
          ],
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching historical data:", err);
      }
    }

    fetchHistoricalData();

    socket.on("digitsUpdate", ({ digits }) => {
      const average =
        digits.reduce((a: number, b: number) => a + b, 0) / digits.length;

      if (average > 8 || average < 2) {
        setAnomalies((prevAnomalies) => [
          ...prevAnomalies,
          `Anomaly detected at ${new Date().toLocaleTimeString()}: ${digits.join(
            ""
          )}`,
        ]);
      }

      setData((prevData) => ({
        labels: [...prevData.labels, new Date().toLocaleTimeString()].slice(
          -20
        ),
        datasets: [
          {
            ...prevData.datasets[0],
            data: [...prevData.datasets[0].data, average].slice(-20),
          },
        ],
      }));
    });

    return () => {
      socket.off("digitsUpdate");
    };
  }, []);

  const options = {
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
      {!isAuthenticated ? (
        <div className="text-center">Please log in to view the dashboard</div>
      ) : isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div>
          <Line options={options} data={data} />
          {anomalies.length > 0 && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
              <h3 className="text-lg font-bold">Anomalies Detected:</h3>
              <ul>
                {anomalies.map((anomaly, index) => (
                  <li key={index}>{anomaly}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
