import express from "express";
import { Server } from "socket.io";
import http from "http";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const supabaseUrl = "https://lliemhskmctauvmbqzdi.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaWVtaHNrbWN0YXV2bWJxemRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0Mjg3MzIsImV4cCI6MjA1NTAwNDczMn0.dZ_93DKDL7b-Vww9FTt2uIaOZdwWN-L-zI4uRkaER7M";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is missing in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

let displayData = Array.from({ length: 12 }, () =>
  Math.floor(Math.random() * 10)
);

const liveNamespace = io.of("/live");

setInterval(async () => {
  const randomIndex = Math.floor(Math.random() * 12);
  displayData[randomIndex] = Math.floor(Math.random() * 10);

  const average = displayData.reduce((a, b) => a + b, 0) / displayData.length;

  if (average > 8 || average < 2) {
    console.warn("Anomaly detected!", { digits: displayData, average });
  }

  try {
    await supabase
      .from("display_data")
      .insert([{ data: JSON.stringify(displayData), timestamp: new Date() }]);
  } catch (error) {
    console.error("Error saving to database:", error);
  }

  liveNamespace.emit("digitsUpdate", { digits: displayData, average });
}, 1000);

liveNamespace.on("connection", (socket) => {
  console.log("Client connected to live namespace");
  socket.emit("digitsUpdate", { digits: displayData });

  socket.on("disconnect", () => {
    console.log("Client disconnected from live namespace");
  });
});

app.get("/api/live-data", (req, res) => {
  res.json({ digits: displayData });
});

app.get("/api/historical-data", async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("display_data")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    res.status(500).json({ error: "Failed to fetch historical data" });
  }
});

app.post("/api/store-data", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { digits } = req.body;
  if (!Array.isArray(digits) || digits.length !== 12) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  try {
    await supabase
      .from("display_data")
      .insert([{ data: JSON.stringify(digits), timestamp: new Date() }]);
    res.status(200).json({ message: "Data stored successfully" });
  } catch (error) {
    console.error("Error saving custom data:", error);
    res.status(500).json({ error: "Failed to store data" });
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An internal server error occurred" });
});

server.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);
