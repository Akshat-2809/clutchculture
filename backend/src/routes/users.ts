import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { profiles } from "../db/schema.js";
import { notFound } from "../lib/httpError.js";
import { requireAuth } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, async (req, res) => {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, req.user!.id),
  });
  if (!profile) throw notFound("Profile not found");
  res.json(profile);
});
