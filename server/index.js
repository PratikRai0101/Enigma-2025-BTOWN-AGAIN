const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const supabase = createClient("SUPABASE_URL", "SUPABASE_ANON_KEY");

let displayData = Array(12).fill(0);

function updateRandomDigit() {
  const randomIndex = Math.floor(Math.random() * 12);
  const randomValue = Math.floor(Math.random() * 10);
  displayData[randomIndex] = randomValue;

  io.emit("digitsUpdate", { digits: displayData });

  saveToDatabase(displayData);
}

async function saveToDatabase(data) {
  const { error } = await supabase.from("display_data").insert({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving data:", error);
  }
}

setInterval(updateRandomDigit, 1000);

app.get("/data", async (req, res) => {
  const { data, error } = await supabase
    .from("display_data")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(20);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
