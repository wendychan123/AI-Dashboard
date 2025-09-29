import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import os from "os";

dotenv.config({ path: ".env.local" });

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5050;

// 🔑 Gemini 代理端點
app.post("/api/gemini", async (req, res) => {
  console.log("📩 收到前端請求:", JSON.stringify(req.body, null, 2));

  try {
    const { messages } = req.body;
    if (!messages) {
      return res.status(400).json({ error: "缺少 messages 參數" });
    }

    // 把 messages (system/user/assistant) 拼接成一個 prompt
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

    console.log("➡️ 準備送出請求到 Gemini...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    console.log("⬅️ Gemini 狀態碼:", response.status);

    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error("⚠️ Gemini 回傳非 JSON:", text);
      return res.status(response.status).json({ error: "Gemini 回傳非 JSON", detail: text });
    }

    console.log("🤖 Gemini 回應 JSON:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "（Gemini 沒有回覆）";

    return res.json({ reply });
  } catch (error) {
    console.error("❌ Proxy API error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
});


// ✅ 最簡單測試端點
app.get("/ping", (req, res) => {
  console.log("✅ 收到 /ping 請求");
  res.json({ message: "pong" });
});

// 啟動 server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Gemini Proxy running on http://localhost:${PORT}`);
  console.log("🔑 Gemini Key 前 8 碼:", process.env.GEMINI_API_KEY?.slice(0, 8));

  // 顯示可用的測試網址
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4") {
        console.log(`🌐 測試網址: http://${net.address}:${PORT}/api/test`);
      }
    }
  }
  console.log(`🌐 測試網址 (localhost): http://localhost:${PORT}/api/test`);
  console.log(`🌐 測試網址 (ping): http://127.0.0.1:${PORT}/ping`);
});
