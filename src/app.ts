import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";

import signupRoute from "./routes/signupRoute";
import userRoute from "./routes/userRoute";
import messageRoute from "./routes/messageRoute";
import groupRoute from "./routes/groupRoute";

import { connect } from "./config/db";
import "./models/index";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL || "",
].filter(Boolean);

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use("/api", signupRoute);
app.use("/api", userRoute);
app.use("/api", messageRoute);
app.use("/api", groupRoute);

app.use(
  "/uplodes",
  express.static(path.join(__dirname, "../uplodes"))
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

connect();

export default app;