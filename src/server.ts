//this is for development
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import signupRoute from "./routes/signupRoute";
import userRoute from "./routes/userRoute";
import messageRoute from "./routes/messageRoute";
import { connect } from "./config/db";
import groupRoute from "./routes/groupRoute";
import "./models/index"; // Ensure all models and associations are loaded
import { initSockets } from "./Sockets";
// import { startJob } from "./jobs/cronJobs";

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001",  process.env.FRONTEND_URL || ""].filter(Boolean);

const app = express();
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use("/api", signupRoute);
app.use("/api", userRoute);
app.use("/api", messageRoute);
app.use("/api", groupRoute);
app.use("/uplodes", express.static(path.join(__dirname, "../uplodes")));
const server = http.createServer(app);

export const io = new Server(server, {  
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});


connect();

// Initialize all socket event handlers
initSockets(io);
// startJob();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
