import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: messages[1].content }] }] }),
      }
    );

    const data = await geminiRes.json();

    return res.status(200).json({
      reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ 沒有回覆",
    });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
