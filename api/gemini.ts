// api/gemini.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("📩 收到前端請求:", JSON.stringify(req.body, null, 2));

  try {
    const { messages } = req.body;
    if (!messages) {
      return res.status(400).json({ error: "缺少 messages 參數" });
    }

    const prompt = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    console.log("➡️ 準備送出請求到 Gemini...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1500,
            temperature: 0.7,
          },
        }),
      }
    );

    console.log("⬅️ Gemini 狀態碼:", response.status);

    let data: any;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error("⚠️ Gemini 回傳非 JSON:", text);
      return res
        .status(response.status)
        .json({ error: "Gemini 回傳非 JSON", detail: text });
    }

    console.log("🤖 Gemini 回應 JSON:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "（Gemini 沒有回覆）";

    return res.json({ reply });
  } catch (error: any) {
    console.error("❌ Proxy API error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
