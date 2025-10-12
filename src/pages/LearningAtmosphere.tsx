import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Chart from "chart.js/auto";
import { BookOpenCheck, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import GaugeChart from "react-gauge-chart";
import remarkGfm from "remark-gfm";

export default function LearningAtmosphereDemo() {
  const radarRef = useRef<HTMLCanvasElement>(null);
  const activityRef = useRef<HTMLCanvasElement>(null);

  // AI 產出內容
  const [aiSummary, setAiSummary] = useState("尚未進行 AI 分析");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // 🔹 控制彈窗開關

  // 模擬數據
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

  const maxValues = {
    practice: 250,
    quiz: 150,
    video: 100,
    vocab: 500,
    math: 100,
  };

  // 🔹 各項指標（差異分析卡片）
  const kpiItems = Object.keys(maxValues).map((key) => {
    const studentValue = (studentData as any)[key];
    const classValue = (classData as any)[`${key}_avg`];
    const diff = studentValue - classValue;
    const isPositive = diff >= 0;
    const diffColor = isPositive ? "text-green-600" : "text-red-600";

    return (
      <div key={key} className="border rounded-lg p-4 text-center shadow-sm bg-white hover:shadow-md transition">
        <p className="text-sm text-muted-foreground mb-2">
          {{
            practice: "練習表現",
            quiz: "測驗答題",
            video: "影片瀏覽",
            vocab: "英文單字",
            math: "數學測驗",
          }[key]}
        </p>
        <p className={`text-3xl font-bold ${diffColor}`}>{isPositive ? `+${diff}` : diff}</p>
        <p className="text-xs text-gray-500">
          您：{studentValue} ｜ 班：{classValue}
        </p>
      </div>
    );
  });


  // 呼叫 Gemini API
  const handleAiAnalysis = async () => {
    setLoading(true);
    try {
      const apiBase =
        import.meta.env.MODE === "development" ? "http://localhost:5050" : "";
      const response = await fetch(`${apiBase}/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "你是一個學習助理，請根據數據幫學生提供學習分析與建議。請務必用 **Markdown 條列式 (3~5點)** 回答，簡潔扼要，每點不超過20字。",
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

      const data = await response.json();
      if (!response.ok || data.error) {
        setAiSummary(`❌ AI 分析失敗：${data.error || "未知錯誤"}`);
        return;
      }
      setAiSummary(data.reply || "⚠️ 沒有收到 Gemini 回覆。");
      setOpen(true); // 🔹 開啟彈窗
    } catch (error: any) {
      setAiSummary(`❌ 發生錯誤：${error.message}`);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1350px] mx-auto space-y-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Radar + AI 彈窗分析 */}
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

          {/* ✅ 按鈕觸發 Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle>綜合評估</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">
                    {aiSummary.length > 30
                      ? aiSummary.substring(0, 30) + "..."
                      : aiSummary}
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI 學習建議</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto mt-2 prose prose-sm dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 text-gray-700 leading-relaxed">{children}</p>
                    ),
                    li: ({ children }) => (
                      <li className="list-disc ml-5">{children}</li>
                    ),
                  }}
                >
                  {aiSummary}
                </ReactMarkdown>
              </div>
            </DialogContent>
          </Dialog>
        </div>


        {/* 🔹 指標 Gauges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>學習指標表現等級</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {Object.entries(maxValues).map(([key, max]) => {
              const value = (studentData as any)[key];
              const percent = Math.min(value / max, 1);
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
                  <p className={`mb-2 text-sm font-medium ${hintColor}`}>{hint}</p>
                  <div className="h-[120px] relative">
                    <GaugeChart
                      id={`gauge-${key}`}
                      nrOfLevels={20}
                      percent={percent}
                      colors={["#FF5F6D", "#FFC371", "#4CAF50"]}
                      arcWidth={0.3}
                      textColor="#333"
                      hideText
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 px-4 mt-1">
                    <span>低</span>
                    <span>普</span>
                    <span>優</span>
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {{
                      practice: "練習表現",
                      quiz: "測驗答題",
                      video: "影片瀏覽",
                      vocab: "英文單字",
                      math: "數學測驗",
                    }[key]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {value} / {max}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 🔹 各項數據詳情卡片 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>各項數據詳情</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(maxValues).map((key) => {
              const studentValue = (studentData as any)[key];
              const classAvg = (classData as any)[`${key}_avg`];
              const max = (maxValues as any)[key];
              const unitMap: Record<string, string> = {
                practice: "次",
                quiz: "題",
                video: "次",
                vocab: "個",
                math: "題",
              };
              const unit = unitMap[key] || "";

              const percentStudent = Math.round((studentValue / max) * 100);
              const percentClass = Math.round((classAvg / max) * 100);
              const better = studentValue >= classAvg;

              const barColor = better ? "bg-blue-500" : "bg-amber-400";

              return (
                <div
                  key={key}
                  className="group p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition relative"
                >
                  {/* 標題 + 數值 */}
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-gray-700">
                      {{
                        practice: "練習表現",
                        quiz: "測驗答題",
                        video: "影片瀏覽",
                        vocab: "英文單字",
                        math: "數學測驗",
                      }[key]}
                    </p>
                    <p className="text-sm text-gray-500">
                      {studentValue} {unit}
                    </p>
                  </div>

                  {/* 🔹 比較長條圖 + hover 提示 */}
                  <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden cursor-pointer">
                    {/* 班級平均底層 */}
                    <div
                      className="absolute top-0 left-0 h-3 rounded-full bg-green-400 opacity-50"
                      style={{ width: `${percentClass}%` }}
                    ></div>

                    {/* 個人表現前層 */}
                    <div
                      className={`absolute top-0 left-0 h-3 rounded-full ${barColor}`}
                      style={{ width: `${percentStudent}%` }}
                    ></div>

                    {/* Hover Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                      您：{percentStudent}% ｜ 班：{percentClass}%
                    </div>
                  </div>

                  {/* 圖例 */}
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>您：{studentValue}</span>
                    <span>班級平均：{classAvg}</span>
                  </div>

                  {/* 建議文字 */}
                  <p
                    className={`mt-2 text-sm font-medium ${
                      better ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {better ? "表現優異！繼續保持！" : "再加把勁！您有潛力超越！"}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 🔹 KPI 差異分析 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>與班級差異分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">{kpiItems}</div>
          </CardContent>
        </Card>


        {/* 🔹 活躍度趨勢 */}
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
