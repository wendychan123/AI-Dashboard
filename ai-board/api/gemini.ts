import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        if (!process.env.GEMINI_API_KEY) {
          throw new Error("❌ 缺少 GEMINI_API_KEY，請在 Vercel 環境變數設定");
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: data.messages.map((m: any) => m.content).join("\n") }]
                }
              ]
            })
          }
        );

        const text = await response.text(); // ⚠️ 先讀 text 看真實回傳
        console.log("🔹 Gemini API 回應:", text);

        let result: any = {};
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error(`Gemini 回傳不是 JSON: ${text}`);
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ reply: result }));
      } catch (err: any) {
        console.error("❌ 後端錯誤:", err.message);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }
}
