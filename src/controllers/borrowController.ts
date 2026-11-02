
import { Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

// Borrow a book using the authenticated user's identity.
export async function borrowBook(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { bookId } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (typeof bookId !== "string" || !ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid book ID.",
      });
      return;
    }

    const db = getDB();
    const books = db.collection("books");
    const borrows = db.collection("borrows");

    const bookObjectId = new ObjectId(bookId);
    const email = user.email.trim().toLowerCase();

    const book = await books.findOne({ _id: bookObjectId });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    // Prevent duplicate active borrowing.
    const existingBorrow = await borrows.findOne({
      bookId: bookObjectId,
      borrowerEmail: email,
      status: "active",
    });

    if (existingBorrow) {
      res.status(409).json({
        success: false,
        message: "You have already borrowed this book.",
      });
      return;
    }

    // Atomically reserve one available copy.
    const inventoryUpdate = await books.updateOne(
      {
        _id: bookObjectId,
        availableCopies: { $gt: 0 },
      },
      {
        $inc: { availableCopies: -1 },
        $set: { updatedAt: new Date() },
      }
    );

    if (inventoryUpdate.modifiedCount === 0) {
      res.status(409).json({
        success: false,
        message: "No copies are currently available.",
      });
      return;
    }

    // Borrower information comes from the verified JWT.
    const borrowRecord = {
      bookId: bookObjectId,
      bookTitle: book.title,
      bookImage: book.image,
      borrowerName: user.name.trim(),
      borrowerEmail: email,
      borrowedAt: new Date(),
      returnedAt: null,
      status: "active" as const,
    };

    try {
      const result = await borrows.insertOne(borrowRecord);

      res.status(201).json({
        success: true,
        message: "Book borrowed successfully.",
        data: {
          _id: result.insertedId,
          ...borrowRecord,
        },
      });
    } catch (insertError) {
      // Restore inventory if creating the borrow record fails.
      await books.updateOne(
        { _id: bookObjectId },
        { $inc: { availableCopies: 1 } }
      );

      throw insertError;
    }
  } catch (error) {
    console.error("Borrow book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to borrow book.",
    });
  }
}

// Retrieve only the authenticated user's borrowing history.
export async function getMyBorrows(
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

    const db = getDB();

    const borrows = await db
      .collection("borrows")
      .find({
        borrowerEmail: user.email.trim().toLowerCase(),
      })
      .sort({ borrowedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    console.error("Get borrows error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve borrowing history.",
    });
  }
}

// Return a book only if it belongs to the authenticated user.
export async function returnBook(
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
        message: "Invalid borrow ID.",
      });
      return;
    }

    const db = getDB();
    const borrows = db.collection("borrows");
    const books = db.collection("books");

    const borrowId = new ObjectId(id);
    const email = user.email.trim().toLowerCase();

    // Find only an active record belonging to this user.
    const borrow = await borrows.findOne({
      _id: borrowId,
      borrowerEmail: email,
      status: "active",
    });

    if (!borrow) {
      res.status(404).json({
        success: false,
        message: "Active borrowing record not found for this user.",
      });
      return;
    }

    // Mark the record as returned only if it is still active.
    const returnUpdate = await borrows.updateOne(
      {
        _id: borrowId,
        borrowerEmail: email,
        status: "active",
      },
      {
        $set: {
          status: "returned",
          returnedAt: new Date(),
        },
      }
    );

    if (returnUpdate.modifiedCount === 0) {
      res.status(409).json({
        success: false,
        message: "This book has already been returned.",
      });
      return;
    }

    // Restore inventory without exceeding total copies.
    const inventoryUpdate = await books.updateOne(
      {
        _id: borrow.bookId,
        $expr: {
          $lt: ["$availableCopies", "$totalCopies"],
        },
      },
      {
        $inc: { availableCopies: 1 },
        $set: { updatedAt: new Date() },
      }
    );

    if (inventoryUpdate.modifiedCount === 0) {
      // Restore the active status if inventory could not be updated.
      await borrows.updateOne(
        {
          _id: borrowId,
          borrowerEmail: email,
          status: "returned",
        },
        {
          $set: { status: "active" },
          $unset: { returnedAt: "" },
        }
      );

      res.status(409).json({
        success: false,
        message: "Could not restore book inventory.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book returned successfully.",
    });
  } catch (error) {
    console.error("Return book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to return book.",
    });
  }
}
