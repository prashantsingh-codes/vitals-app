import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Vitals API server running ✅" });
});

// Proxy route to Anthropic
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY not set. Please add it to your server/.env file.",
    });
  }

  try {
    const { messages } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:
          "You are Vitals AI, a friendly health and nutrition coach embedded in a fitness tracker app. The user tracks: calories (goal 1800kcal), protein (130g), fat (55g). They eat Indian vegetarian foods like dal, paneer, soya, rice, milk, oats, whey, and eggs. Give concise, practical, warm advice. Use emojis occasionally. Keep replies under 120 words.",
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    res.json(data);
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
});

app.listen(PORT, () => {
  console.log(`\n🌿 Vitals server running at http://localhost:${PORT}`);
  console.log(
    `   API key loaded: ${process.env.ANTHROPIC_API_KEY ? "✅ Yes" : "❌ No (add to server/.env)"}\n`
  );
});
