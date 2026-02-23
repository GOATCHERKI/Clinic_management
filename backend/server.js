import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import chatRouter from "./routes/chatRoute.js";
import appointmentRouter from "./routes/appointmentRoutes.js";
import { startReminderScheduler } from "./services/schedulerService.js";

console.log("--- chatRoute.js loaded and chatRouter defined ---");

// app config
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST"],
  },
});

// Attach socket.io instance to app
app.set("socketio", io);

const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
    // io.to(socket.id).emit('joined_chat', chatId);
  });

  // Leave a chat room
  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat: ${chatId}`);
  });

  // Handle new messages
  socket.on("send_message", (data) => {
    console.log("Received send_message:", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/chat", chatRouter);
app.use("/api/appointments", appointmentRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Start the reminder email scheduler
startReminderScheduler();

httpServer.listen(port, () => console.log(`Server started on PORT:${port}`));
