import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { isProd } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: z.flattenError(err) });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    ...(isProd ? {} : { message: err instanceof Error ? err.message : String(err) }),
  });
};
