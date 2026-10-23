import { Router } from "express";
import { adminRouter } from "./admin/index.js";
import { catalogRouter } from "./catalog.js";
import { ordersRouter } from "./orders.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use("/", usersRouter);
apiRouter.use("/", catalogRouter);
// Includes the Razorpay webhook (raw body mounted in app.ts).
apiRouter.use("/", ordersRouter);
apiRouter.use("/admin", adminRouter);

// Phase 3: cart sync, addresses, wishlist sync
