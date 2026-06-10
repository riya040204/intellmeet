const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "IntellMeet API is running!" });
});

// Socket.io real-time logic
const rooms = {};

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Join a meeting room
  socket.on("join-room", ({ roomId, userId, userName }) => {
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ socketId: socket.id, userId, userName });

    // Tell others someone joined
    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
      userId,
      userName,
    });

    // Send existing users to new joiner
    socket.emit(
      "existing-users",
      rooms[roomId].filter((u) => u.socketId !== socket.id),
    );

    console.log(`👤 ${userName} joined room ${roomId}`);
  });

  // WebRTC signaling
  socket.on("offer", ({ offer, to }) => {
    socket.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    socket.to(to).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Chat messages
  socket.on("chat-message", ({ roomId, message, userName }) => {
    io.to(roomId).emit("chat-message", {
      message,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave room
  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((u) => u.socketId !== socket.id);
    }
    socket.to(roomId).emit("user-left", { socketId: socket.id });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((u) => u.socketId !== socket.id);
      socket.to(roomId).emit("user-left", { socketId: socket.id });
    }
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err.message));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
