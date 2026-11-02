
import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";
import { BOOK_CATEGORIES } from "../models/Book.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

// ============================================
// Get all books (Public)
// Optional query parameter: ?limit=6
// Books are sorted newest first in MongoDB.
// ============================================

export async function getBooks(
  req: Request,
  res: Response
) {
  try {
    const db = getDB();

    const cursor = db
      .collection("books")
      .find({})
      .sort({ createdAt: -1 });

    const limitParam = req.query.limit;

    if (typeof limitParam === "string") {
      const limit = Number(limitParam);

      if (Number.isInteger(limit) && limit > 0) {
        cursor.limit(Math.min(limit, 100));
      }
    }

    const books = await cursor.toArray();

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Get books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve books.",
    });
  }
}

// ============================================
// Get a single book (Public)
// ============================================

export async function getBookById(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
      return;
    }

    const db = getDB();

    const book = await db.collection("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Get book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve book.",
    });
  }
}

// ============================================
// Create a book (Authenticated)
// ============================================

export async function createBook(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    // Validate required fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      typeof image !== "string" ||
      !image.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required book information.",
      });
      return;
    }

    // Validate category
    if (
      typeof category !== "string" ||
      !BOOK_CATEGORIES.includes(
        category as (typeof BOOK_CATEGORIES)[number]
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid book category.",
      });
      return;
    }

    // Validate total copies
    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      res.status(400).json({
        success: false,
        message: "Total copies must be a positive integer.",
      });
      return;
    }

    const db = getDB();
    const now = new Date();

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      category,
      image: image.trim(),
      description: description.trim(),
      totalCopies: copies,
      availableCopies: copies,

      // Owner information comes from the verified JWT.
      addedBy: {
        name: user.name.trim(),
        email: user.email.trim().toLowerCase(),
      },

      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("books").insertOne(newBook);

    res.status(201).json({
      success: true,
      message: "Book added successfully.",
      data: {
        _id: result.insertedId,
        ...newBook,
      },
    });
  } catch (error) {
    console.error("Create book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add book.",
    });
  }
}

// ============================================
// Update a book (Owner only)
// ============================================

export async function updateBook(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user;
    const id = req.params.id;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
      return;
    }

    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    const db = getDB();
    const books = db.collection("books");
    const bookId = new ObjectId(id);

    const existingBook = await books.findOne({
      _id: bookId,
    });

    if (!existingBook) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    // Check book ownership.
    if (
      existingBook.addedBy?.email?.toLowerCase() !==
      user.email.trim().toLowerCase()
    ) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to update this book.",
      });
      return;
    }

    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid title.",
        });
        return;
      }

      updates.title = title.trim();
    }

    if (author !== undefined) {
      if (typeof author !== "string" || !author.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid author.",
        });
        return;
      }

      updates.author = author.trim();
    }

    if (category !== undefined) {
      if (
        typeof category !== "string" ||
        !BOOK_CATEGORIES.includes(
          category as (typeof BOOK_CATEGORIES)[number]
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid book category.",
        });
        return;
      }

      updates.category = category;
    }

    if (image !== undefined) {
      if (typeof image !== "string" || !image.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid image URL.",
        });
        return;
      }

      updates.image = image.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid description.",
        });
        return;
      }

      updates.description = description.trim();
    }

    if (totalCopies !== undefined) {
      const copies = Number(totalCopies);

      const currentlyBorrowed =
        Number(existingBook.totalCopies ?? 0) -
        Number(existingBook.availableCopies ?? 0);

      if (
        !Number.isInteger(copies) ||
        copies < 1 ||
        copies < currentlyBorrowed
      ) {
        res.status(400).json({
          success: false,
          message:
            "Total copies cannot be less than currently borrowed copies.",
        });
        return;
      }

      updates.totalCopies = copies;
      updates.availableCopies = copies - currentlyBorrowed;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
      return;
    }

    updates.updatedAt = new Date();

    // Include ownership in the database update filter too.
    const updateResult = await books.updateOne(
      {
        _id: bookId,
        "addedBy.email": user.email.trim().toLowerCase(),
      },
      {
        $set: updates,
      }
    );

    if (updateResult.matchedCount === 0) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to update this book.",
      });
      return;
    }

    const updatedBook = await books.findOne({
      _id: bookId,
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully.",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Update book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update book.",
    });
  }
}

// ============================================
// Delete a book (Owner only)
// ============================================

export async function deleteBook(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user;
    const id = req.params.id;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
      return;
    }

    const db = getDB();

    const result = await db.collection("books").deleteOne({
      _id: new ObjectId(id),
      "addedBy.email": user.email.trim().toLowerCase(),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message:
          "Book not found or you are not authorized to delete it.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully.",
    });
  } catch (error) {
    console.error("Delete book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book.",
    });
  }
}
