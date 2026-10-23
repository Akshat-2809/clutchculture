import { app } from "./app.js";
import { env } from "./config/env.js";
import { sql } from "./db/client.js";
import { expireReservations } from "./services/orders.js";

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

// Release stock held by orders that weren't paid within the reservation window.
const reservationTimer = setInterval(() => {
  expireReservations()
    .then((n) => n && console.log(`Released stock from ${n} unpaid order(s)`))
    .catch((err) => console.error("expireReservations failed", err));
}, 60_000);

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  clearInterval(reservationTimer);
  server.close();
  await sql.end({ timeout: 5 });
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
