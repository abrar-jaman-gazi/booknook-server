
import { ObjectId } from "mongodb";

export interface Borrow {
  _id?: ObjectId;
  bookId: ObjectId;
  bookTitle: string;
  bookImage: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowedAt: Date;
  returnedAt: Date | null;
  status: "active" | "returned";
}
