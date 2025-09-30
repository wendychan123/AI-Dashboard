import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chart from "chart.js/auto";
import GaugeChart from "react-gauge-chart";
import { BookOpenCheck, ArrowLeft, PenTool, BarChart3, TrendingUp, Target, Brain, Lightbulb, Zap, Clock, Award } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export default function LearningAtmosphereDemo() {
  const radarRef = useRef<HTMLCanvasElement>(null);
  const activityRef = useRef<HTMLCanvasElement>(null);

  // 🔹 Gemini 產生的文字
  const [aiSummary, setAiSummary] = useState("請點擊 AI 分析按鈕，產生專屬建議。");
  const [loading, setLoading] = useState(false);

  // 🔹 模擬數據
  const studentData = {
    pr_value: 75.8,
    practice: 166,
    quiz: 85,
    video: 92,
    vocab: 320,
    math: 55,
    activity: [20, 25, 35, 30, 45, 50],
  };
  const classData = {
    practice_avg: 140,
    quiz_avg: 95,
    video_avg: 42,
    vocab_avg: 250,
    math_avg: 60,
    activity_avg: [22, 28, 30, 32, 40, 42],
  };

  const maxValues = {
    practice: 250,
    quiz: 150,
    video: 100,
    vocab: 500,
    math: 100,
  };


  // 🔹 Radar & Line Chart 初始化
  useEffect(() => {
    if (radarRef.current) {
      new Chart(radarRef.current, {
        type: "radar",
        data: {
          labels: ["練習表現", "測驗答題", "影片瀏覽", "英文單字", "數學測驗"],
          datasets: [
            {
              label: "個人",
              data: [
                studentData.practice,
                studentData.quiz,
                studentData.video,
                studentData.vocab,
                studentData.math,
              ],
              backgroundColor: "rgba(74,144,226,0.2)",
              borderColor: "rgba(74,144,226,1)",
            },
            {
              label: "班級平均",
              data: [
                classData.practice_avg,
                classData.quiz_avg,
                classData.video_avg,
                classData.vocab_avg,
                classData.math_avg,
              ],
              backgroundColor: "rgba(80,227,194,0.2)",
              borderColor: "rgba(80,227,194,1)",
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }

    if (activityRef.current) {
      new Chart(activityRef.current, {
        type: "line",
        data: {
          labels: ["六週前", "五週前", "四週前", "三週前", "二週前", "上週"],
          datasets: [
            {
              label: "個人",
              data: studentData.activity,
              borderColor: "rgba(74,144,226,1)",
              backgroundColor: "rgba(74,144,226,0.1)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "班級平均",
              data: classData.activity_avg,
              borderColor: "rgba(80,227,194,1)",
              backgroundColor: "rgba(80,227,194,0.1)",
              fill: true,
              borderDash: [5, 5],
              tension: 0.4,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }
  }, []);

  // 🔹 呼叫 Gemini Proxy API
  const handleAiAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "你是一個學習助理，請根據數據幫學生提供學習分析與建議。請務必用 **Markdown 條列式 (3~5點)** 回答，簡潔扼要，每點不超過20字。",
            },
            {
              role: "user",
              content: `以下是某位學生與班級平均數據：
                練習表現：${studentData.practice} (班平均 ${classData.practice_avg})
                測驗答題：${studentData.quiz} (班平均 ${classData.quiz_avg})
                影片瀏覽：${studentData.video} (班平均 ${classData.video_avg})
                英文單字：${studentData.vocab} (班平均 ${classData.vocab_avg})
                數學測驗：${studentData.math} (班平均 ${classData.math_avg})
                請以「數據解析、學習提醒、行動建議」三個段落，輸出 Markdown 條列式分析。`,
            },
          ],
        }),
      });

      {/*const data = await response.json();

      if (!response.ok || data.error) {
        const errMsg = data.error || "未知錯誤";
        setAiSummary(`❌ AI 分析失敗：${errMsg}`);
        return;
      } */}

      const raw = await response.text(); // 先讀文字
      console.log("🔹 後端回應:", raw);

      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        setAiSummary(`❌ AI 分析失敗：後端回傳不是 JSON (${raw})`);
        return;
      }

      if (!response.ok || !data) {
        setAiSummary(`❌ AI 分析失敗：${data?.error || "後端沒有回傳 JSON"}`);
        return;
      }

      const text = data.reply || "⚠️ 沒有收到 Gemini 回覆。";
      setAiSummary(text);

    } catch (error: any) {
      console.error("前端呼叫 Proxy API 出錯:", error);
      setAiSummary(`❌ 發生錯誤：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-background border-b border-border/20 mb-4 -mx-4 -mt-8 px-2 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpenCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">學習氛圍比較分析</h1>
          </div>
        </div>

        {/* Radar + AI Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>學習氛圍雷達圖</CardTitle>
              <button
                onClick={handleAiAnalysis}
                disabled={loading}
                className="p-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 transition"
              >
                {loading ? "分析中..." : <Brain className="w-4 h-4" />}
              </button>
            </CardHeader>
            <CardContent className="h-[400px]">
              <canvas ref={radarRef}></canvas>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>綜合評估</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ✅ 改用 Markdown 渲染 */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 text-gray-700">{children}</p>,
                  li: ({ children }) => <li className="list-disc ml-5">{children}</li>,
                }}
              >
                {aiSummary}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </div>

      {/* 指標 Gauges (react-gauge-chart) */}
      <div className="grid gap-12 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>學習指標表現等級</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-18">
          {Object.entries(maxValues).map(([key, max]) => {
            const value = (studentData as any)[key];
            const percent = Math.min(value / max, 1); // 0~1

            // 🔹 提示語判斷
            let hint = "等待數據分析";
            let hintColor = "text-gray-500";
            if (percent >= 0.8) {
              hint = "表現傑出，繼續保持！";
              hintColor = "text-green-600";
            } else if (percent >= 0.4) {
              hint = "表現合格，穩定進步中！";
              hintColor = "text-yellow-600";
            } else {
              hint = "仍有進步空間，加油！";
              hintColor = "text-red-600";
            }

            return (
              <div key={key} className="text-center">
                {/* 提示語 */}
                <p className={`mb-2 text-sm font-medium ${hintColor}`}>{hint}</p>

                {/* 儀表圖 */}
                <div className="h-[120px] relative">
                  <GaugeChart
                    id={`gauge-${key}-${Math.random()}`} // 🔹確保唯一
                    nrOfLevels={20}
                    percent={percent}
                    colors={["#FF5F6D", "#FFC371", "#4CAF50"]}
                    arcWidth={0.3}
                    textColor="#333"
                    hideText={true}
                  />


                  {/* 區間標籤 (低 / 普 / 優) */}
                  <div className="absolute bottom-[-10px] left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
                    <span>低</span>
                    <span>普</span>
                    <span>優</span>
                  </div>
                </div>

                {/* 指標名稱 */}
                <p className="mt-4 text-sm font-medium">
                  {{
                    practice: "練習表現",
                    quiz: "測驗答題",
                    video: "影片瀏覽",
                    vocab: "英文單字",
                    math: "數學測驗",
                  }[key]}
                </p>

                {/* 數值顯示 */}
                <p className="text-xs text-muted-foreground">
                  {value} / {max}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
      </div>


        {/* 活躍度 */}
        <Card>
          <CardHeader>
            <CardTitle>每週學習活躍度趨勢</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <canvas ref={activityRef}></canvas>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

