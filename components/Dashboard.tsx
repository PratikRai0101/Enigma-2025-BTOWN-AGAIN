"use client"

import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const socket = io("http://localhost:3001")

export default function Dashboard() {
  const [data, setData] = useState({
    labels: [],
    datasets: [
      {
        label: "Average Value",
        data: [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  })

  useEffect(() => {
    socket.on("digitsUpdate", (newDigits) => {
      const average = newDigits.reduce((a, b) => a + b, 0) / newDigits.length
      setData((prevData) => ({
        labels: [...prevData.labels, new Date().toLocaleTimeString()].slice(-20),
        datasets: [
          {
            ...prevData.datasets[0],
            data: [...prevData.datasets[0].data, average].slice(-20),
          },
        ],
      }))
    })

    return () => {
      socket.off("digitsUpdate")
    }
  }, [])

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
  }

  return (
    <div className="w-full max-w-3xl">
      <Line options={options} data={data} />
    </div>
  )
}

