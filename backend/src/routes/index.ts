import { Router } from "express";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use("/", usersRouter);

// Phase 2: products, collections, admin/products
// Phase 3: cart, addresses, wishlist
// Phase 4: orders, payments (webhook mounted with raw body in app.ts), admin/orders
