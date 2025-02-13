"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function DisplaySimulation() {
  const [digits, setDigits] = useState(Array(12).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      const newDigits = Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 10)
      );
      setDigits(newDigits);
      socket.emit("updateDigits", newDigits);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex space-x-2 mb-8">
      {digits.map((digit, index) => (
        <div
          key={index}
          className="w-12 h-16 bg-gray-200 flex items-center justify-center text-2xl font-bold rounded"
        >
          {digit}
        </div>
      ))}
    </div>
  );
}
