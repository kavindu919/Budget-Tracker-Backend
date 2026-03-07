import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    descriptin: "application working",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`server runing on port ${PORT}`);
});
