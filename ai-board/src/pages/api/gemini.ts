// api/gemini.ts
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "pong" }));
    return;
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        // 🔹 這裡改成呼叫 Gemini API
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ reply: "Gemini 回覆測試成功", input: data }));
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
}
