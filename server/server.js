const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const gameRoutes = require("./routes/gameRoutes");
const authRoutes = require("./routes/auth.routes");
const { setupSocketEvents } = require("./socket/socketManager");
const { cleanupOldGames } = require("./services/gameService");

dotenv.config();

// App + Server
const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/", gameRoutes);

// Socket Events
setupSocketEvents(io);

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🎮 Sockets ready at ws://localhost:${PORT}`);
    });
  })
  .catch(err => console.error("❌ Mongo error:", err));

// Cleanup job
setInterval(cleanupOldGames, 60 * 60 * 1000);
