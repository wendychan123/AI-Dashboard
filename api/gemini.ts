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

    // 將 messages 合併成 prompt（Gemini 支援多輪對話格式）
    const contents = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    console.log("➡️ 送出 Gemini API 請求...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
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

    // 🧩 嘗試多種結構抓取模型文字
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
      data?.output_text ||
      data?.text ||
      "（Gemini 沒有回覆文字）";

    // 若完全沒內容，也回傳完整 debug 結果
    if (!reply || reply.trim() === "") {
      return res.status(200).json({
        reply: "（Gemini 回覆為空）",
        debug: data,
      });
    }

    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error("❌ Proxy API error:", error);
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
