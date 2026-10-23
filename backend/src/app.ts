import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

// Render sits behind a proxy; needed for correct client IPs in rate limiting.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));

// Razorpay webhook signature is computed over the raw body, so it must be
// parsed as a Buffer before express.json() runs.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiLimiter, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
