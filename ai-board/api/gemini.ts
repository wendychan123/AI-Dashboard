import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ message: "pong" });
  }

  if (req.method === "POST") {
    try {
      const { messages } = req.body;

      const prompt = messages
        .map((m: any) => `${m.role}: ${m.content}`)
        .join("\n");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Gemini 沒有回覆";

      return res.status(200).json({ reply });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
