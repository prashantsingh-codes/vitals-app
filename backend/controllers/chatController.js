import fetch from "node-fetch";

const SYSTEM_PROMPT =
  "You are Vitals AI, a friendly health and nutrition coach embedded in a fitness tracker app. " +
  "The user tracks daily calories, protein, and fat. They eat Indian foods like dal, paneer, soya, rice, milk, oats, whey, and eggs. " +
  "Give concise, warm, practical advice. Use emojis occasionally. Keep replies under 120 words.";

export async function chat(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  try {
    const { messages } = req.body;

    const allContents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || m.text || "" }],
    }));

    // Gemini requires conversation to start with a user message
    const firstUserIdx = allContents.findIndex((m) => m.role === "user");
    if (firstUserIdx === -1) return res.status(400).json({ error: "No user message found" });
    const contents = allContents.slice(firstUserIdx);

    let data, response;

    // Retry up to 3 times on rate limit (429)
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
          }),
        }
      );
      data = await response.json();

      if (response.status === 429) {
        console.log(`Rate limited, attempt ${attempt}/3 — waiting ${3000 * attempt}ms...`);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 3000 * attempt));
      } else {
        break;
      }
    }

    if (!response.ok) return res.status(response.status).json({ error: data });

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't respond right now.";

    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(500).json({ error: "Failed to reach Gemini API" });
  }
}
