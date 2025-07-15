const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http"); // <-- Required for socket server
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const responseRoutes = require('./routes/responses.route.js');
const gameRoutes = require('./routes/game.routes');
const tiebreakerRoutes = require('./routes/tiebreaker.route');

dotenv.config();

const app = express();
const server = http.createServer(app); // <-- Create HTTP server from Express app

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust to your frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection logic
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("joinGame", (data) => {
    console.log(`${data.username} joined as ${data.team}`);
    socket.join(data.team); // join the team room
    io.emit("playerJoined", data);
  });

  socket.on("submitAnswer", (payload) => {
    io.emit("answerSubmitted", payload); // Broadcast to everyone
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/response', responseRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/tiebreaker', tiebreakerRoutes);

app.get("/", (req, res) => res.send("API running"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch(err => console.error("Mongo error:", err));
