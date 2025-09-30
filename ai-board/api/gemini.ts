import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ message: "pong" });
  }

  if (req.method === "POST") {
    try {
      const data = req.body; // ✅ Vercel 會自動 parse JSON
      return res.status(200).json({
        reply: "Gemini 回覆測試成功",
        input: data,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // 其它 method 一律拒絕
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
