import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { db } from "../db/client.js";
import { profiles } from "../db/schema.js";
import { forbidden, unauthorized } from "../lib/httpError.js";

/** Use after requireAuth. Role is read from the DB, never from the token. */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  if (!req.user) throw unauthorized();

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, req.user.id),
    columns: { role: true },
  });

  if (profile?.role !== "admin") throw forbidden("Admin access required");
  next();
};
