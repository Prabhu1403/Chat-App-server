import http from "http";
import { Server } from "socket.io";

import app from "../src/app";
import { initSockets } from "../src/Sockets";

const server = http.createServer(app);
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001",  process.env.FRONTEND_URL || ""].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSockets(io);

export default server;