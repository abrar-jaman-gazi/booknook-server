
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  name: string;
}

export function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Check authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
    return;
  }

  const secret = process.env.JWT_SECRET;

  // Missing server configuration is an internal error.
  if (!secret) {
    console.error("JWT_SECRET is not configured.");

    res.status(500).json({
      success: false,
      message: "Authentication service is not configured.",
    });
    return;
  }

  try {
    // Accept only tokens signed using HS256.
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    // Validate decoded payload.
    if (
      typeof decoded !== "object" ||
      decoded === null
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    const payload = decoded as JwtPayload;

    if (
      typeof payload.id !== "string" ||
      !payload.id.trim() ||
      typeof payload.email !== "string" ||
      !payload.email.trim() ||
      typeof payload.name !== "string" ||
      !payload.name.trim()
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}
