import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ message: "pong" });
  }

  if (req.method === "POST") {
    return res.status(200).json({ reply: "Gemini 回覆測試成功" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
