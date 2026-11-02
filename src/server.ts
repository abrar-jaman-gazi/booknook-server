
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectDB } from "./config/db.js";
import bookRoutes from "./routes/bookRoutes.js";
import borrowRoutes from "./routes/borrowRoutes.js";

const app = express();

const PORT = process.env.PORT || 5001;

// ============================================
// CORS Configuration
// ============================================

// Add frontend URLs to CLIENT_URLS in the backend environment.
// Multiple URLs can be separated by commas.

const allowedOrigins = (
  process.env.CLIENT_URLS || "http://localhost:3000"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as
      // server-to-server requests and local API testing.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================================
// Security and Body Parsing
// ============================================

app.use(helmet());

app.use(express.json());

// ============================================
// API Routes
// ============================================

app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);

// ============================================
// Root Route
// ============================================

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to BookNook API!",
  });
});

// ============================================
// Health Check
// ============================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BookNook server is healthy.",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Start Server
// ============================================

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`BookNook server running on port ${PORT}`);
      console.log("Allowed frontend origins:", allowedOrigins);
    });
  } catch (error) {
    console.error(
      "Server startup failed. Check your MongoDB configuration.",
      error
    );

    process.exit(1);
  }
}

startServer();
