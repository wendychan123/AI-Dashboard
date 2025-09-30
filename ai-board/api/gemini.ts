import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ message: "pong" });
  }

  if (req.method === "POST") {
    try {
      const data = req.body; // Vercel 自動 parse JSON

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: data.messages?.map((m: any) => m.content).join("\n") }]
              }
            ]
          }),
        }
      );

      const resultText = await response.text(); // 先讀字串
      console.log("🔹 Gemini raw response:", resultText);

      // 嘗試 parse JSON
      try {
        const json = JSON.parse(resultText);
        return res.status(200).json({ reply: json });
      } catch (e) {
        // 如果不是 JSON，回傳錯誤訊息給前端
        return res.status(500).json({
          error: "Gemini 回傳非 JSON",
          raw: resultText,
        });
      }

    } catch (err: any) {
      console.error("❌ API error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
