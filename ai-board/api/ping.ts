import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: "pong",
    hasApiKey: !!process.env.GEMINI_API_KEY, // 是否讀到環境變數
    keyPreview: process.env.GEMINI_API_KEY?.slice(0, 6) + "..." // 前幾碼方便確認
  });
}
