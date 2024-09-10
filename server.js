require("dotenv").config();
const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const auth = require("basic-auth");

const app = express();

// Create a new PostgreSQL connection pool
let pool;
try {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in the environment variables");
    process.exit(1);
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    }
  });
  console.log("PostgreSQL connection pool created successfully");
} catch (error) {
  console.error("Error creating PostgreSQL connection pool:", error);
  process.exit(1);
}

// Function to initialize the database and tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_answer INTEGER NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS secret_keys (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL
      )
    `);
    await pool.query(`
      DELETE FROM secret_keys WHERE id != 1;
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

async function ensureCorrectSecretKey() {
  try {
    const result = await pool.query("SELECT * FROM secret_keys");
    if (result.rows.length === 0) {
      await pool.query("INSERT INTO secret_keys (id, key) VALUES (1, $1)", [
        "OctObEr1St",
      ]);
    } else if (result.rows.length > 1 || result.rows[0].key !== "OctObEr1St") {
      await pool.query("DELETE FROM secret_keys");
      await pool.query("INSERT INTO secret_keys (id, key) VALUES (1, $1)", [
        "OctObEr1St",
      ]);
    }
  } catch (error) {
    console.error("Error ensuring correct secret key:", error);
  }
}

// Initialize the database
initDatabase()
  .then(() => ensureCorrectSecretKey())
  .catch(console.error);

// Authentication middleware
function authenticate(req, res, next) {
  const credentials = auth(req);
  if (
    !credentials ||
    credentials.name !== "admin" ||
    credentials.pass !== "password"
  ) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Panel"');
    res.end("Access denied");
  } else {
    next();
  }
}

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Serve the frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve the admin panel (with authentication)
app.get("/admin", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// API endpoint for secret key
app.post("/api/secret-key", async (req, res) => {
  try {
    const result = await pool.query("SELECT key FROM secret_keys WHERE id = 1");
    const secretKey = result.rows[0].key;
    console.log("Secret key retrieved from database");
    res.json({ secretKey });
  } catch (error) {
    console.error("Error retrieving secret key:", error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the secret key." });
  }
});

// API endpoint to update secret key
app.post("/api/update-secret-key", authenticate, async (req, res) => {
  try {
    const { newSecretKey } = req.body;
    if (!newSecretKey) {
      return res.status(400).json({ error: "New secret key is required" });
    }
    await pool.query("UPDATE secret_keys SET key = $1 WHERE id = 1", [
      newSecretKey,
    ]);
    console.log("Secret key updated successfully");
    res.json({ message: "Secret key updated successfully" });
  } catch (error) {
    console.error("Error updating secret key:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the secret key." });
  }
});

// API endpoint to store user results
app.post("/api/store-result", async (req, res) => {
  const { userId, score } = req.body;
  try {
    await pool.query(
      "INSERT INTO quiz_results (user_id, score) VALUES ($1, $2)",
      [userId, score],
    );
    res.json({ message: "Result stored successfully" });
  } catch (error) {
    console.error("Error storing result:", error);
    res
      .status(500)
      .json({ error: "An error occurred while storing the result." });
  }
});

// API endpoint to get all questions
app.get("/api/questions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM questions");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching questions." });
  }
});

// API endpoint to get a single question
app.get("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM questions WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Question not found" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Error fetching question:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the question." });
  }
});

// API endpoint to add a new question
app.post("/api/questions", async (req, res) => {
  const { question, options, correct_answer } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO questions (question, options, correct_answer) VALUES ($1, $2, $3) RETURNING *",
      [question, options, correct_answer],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding question:", error);
    res
      .status(500)
      .json({ error: "An error occurred while adding the question." });
  }
});

// API endpoint to update a question
app.put("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const { question, options, correct_answer } = req.body;
  try {
    const result = await pool.query(
      "UPDATE questions SET question = $1, options = $2, correct_answer = $3 WHERE id = $4 RETURNING *",
      [question, options, correct_answer, id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Question not found" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Error updating question:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the question." });
  }
});

// API endpoint to delete a question
app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM questions WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Question not found" });
    } else {
      res.json({ message: "Question deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting question:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the question." });
  }
});

app.delete("/api/admin/clear-quiz-stats", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM quiz_results");
    console.log("Quiz statistics cleared successfully");
    res.json({ message: "Quiz statistics cleared successfully" });
  } catch (error) {
    console.error("Error clearing quiz statistics:", error);
    res
      .status(500)
      .json({ error: "An error occurred while clearing quiz statistics." });
  }
});

// API endpoint to get quiz statistics
app.get("/api/quiz-stats", async (req, res) => {
  try {
    const totalQuizzes = await pool.query("SELECT COUNT(*) FROM quiz_results");
    const averageScore = await pool.query(
      "SELECT AVG(score) / 7 AS avg FROM quiz_results",
    );
    res.json({
      totalQuizzes: parseInt(totalQuizzes.rows[0].count),
      averageScore: parseFloat(averageScore.rows[0].avg),
    });
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching quiz statistics." });
  }
});

// Export the app for use in Vercel
module.exports = app;
