import type { RequestHandler } from "express";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { unauthorized } from "../lib/httpError.js";

// Supabase signs access tokens with asymmetric keys (JWKS). Older projects may
// still use the HS256 shared secret, so both are supported.
const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
const legacySecret = env.SUPABASE_JWT_SECRET
  ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET)
  : null;

const verifyOptions = {
  issuer: `${env.SUPABASE_URL}/auth/v1`,
  audience: "authenticated",
};

async function verifyToken(token: string) {
  const { alg } = decodeProtectedHeader(token);
  if (alg === "HS256") {
    if (!legacySecret) throw unauthorized("HS256 token but SUPABASE_JWT_SECRET is not set");
    return jwtVerify(token, legacySecret, verifyOptions);
  }
  return jwtVerify(token, jwks, verifyOptions);
}

function getBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

/** Requires a valid Supabase access token; sets req.user. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) throw unauthorized("Missing bearer token");

  try {
    const { payload } = await verifyToken(token);
    if (!payload.sub) throw unauthorized("Invalid token");
    req.user = { id: payload.sub, email: payload.email as string | undefined };
  } catch {
    throw unauthorized("Invalid or expired token");
  }
  next();
};

/** Sets req.user if a valid token is present, but doesn't require one (e.g. guest checkout). */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (token) {
    try {
      const { payload } = await verifyToken(token);
      if (payload.sub) req.user = { id: payload.sub, email: payload.email as string | undefined };
    } catch {
      // Treat an invalid token as a guest.
    }
  }
  next();
};
