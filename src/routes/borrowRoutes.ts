
import { Router } from "express";
import {
  borrowBook,
  getMyBorrows,
  returnBook,
} from "../controllers/borrowController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// All borrowing operations require authentication.
router.post("/", verifyToken, borrowBook);
router.get("/", verifyToken, getMyBorrows);
router.delete("/:id", verifyToken, returnBook);

export default router;
