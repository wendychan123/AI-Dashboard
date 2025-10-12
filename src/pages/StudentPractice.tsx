import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudent } from "@/contexts/StudentContext";
import { ArrowLeft, PenTool, BarChart3, TrendingUp, Target, Brain, Lightbulb, Zap, Clock, Award } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Line, Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend,
} from "chart.js";

// 註冊 Chart.js 元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartJsTooltip,
  ChartDataLabels,
  Legend
);

// CSV URL
const CSV_PRACTICE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjuUAxurul4du6S5xU8G8EPICQXTahTlI3wdu3Ts79IKIpYN8dumxLnXdrwr_p0Mg-3q3zUI6K1AvD/pub?gid=710180589&single=true&output=csv";
const CSV_PRACTICE_ITEMS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRD57cnc7a_AdBnniC5JArEg9_yADLWytVUJFg-UvtUtXrWgqZzkCDfwcqCL-kF6-v2x6RpaNbzHlnT/pub?gid=513380032&single=true&output=csv";
const CSV_PRACTICE_SESSION =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQmFiHAAyAJOy2E4EEt4ai0un6LdF8gjkEIpbq4V3rY-n4VxxIWomYqrKRzfWqL2MCO-b3v1BmSYNYc/pub?gid=1105603400&single=true&output=csv";


// 資料結構
export interface PracticeRowCSV {
  user_sn: string;
  organization_id: string;
  grade: string;
  class: string;
  seat: string;
  chinese_score: string;
  math_score: string;
  english_score: string;
  prac_sn: string;
  date: string;
  during_time: string;
  score_rate: string;
  binary_res: string;
  items_ans_time: string;
  indicator_name: string;
  subject_name: string;
}

interface PracticeRow {
  user_sn: number;
  organization_id: number;
  grade: number;
  class: number;
  seat: number;
  chinese_score: number | null;
  math_score: number | null;
  english_score: number | null;
  prac_sn: number | null;
  date: Date | null;
  during_time: number | null;
  score_rate: number | null;
  binary_res: number[];
  items_ans_time: number[];
  indicator_name: string;
  subject_name: string;
}

export interface PracticeSessionCSV {
  user_sn: string;
  prac_sn: string;
  date: string;
  subject_name: string;
  indicator_name: string;
  n_items: string;
  n_correct: string;
  acc: string;         // 平均正確率 (0~1)
  avg_rt_sec: string;  // 平均作答時間 (秒)
}

interface PracticeSession {
  user_sn: number;
  prac_sn: number;
  date: Date | null;
  subject_name: string;
  indicator_name: string;
  n_items: number;
  n_correct: number;
  acc: number;
  avg_rt_sec: number;
}

export interface PracticeItemCSV {
  user_sn: string;
  prac_sn: string;
  date: string;
  subject_name: string;
  indicator_name: string;
  item_pos: string;
  is_correct: string;
  rt_sec: string;
}

interface PracticeItem {
  user_sn: number;
  prac_sn: number;
  date: Date | null;
  subject_name: string;
  indicator_name: string;
  item_pos: number;
  is_correct: number;
  rt_sec: number;
}


export default function StudentPractice() {
  const { studentInfo } = useStudent();
  const [practiceRows, setPracticeRows] = useState<PracticeRow[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  // 共用函式
  const toNum = (v: any): number | null => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : null;
  };
  const splitNums = (s?: string) =>
    (s || "")
      .split("@XX@")
      .map((x) => Number(String(x).trim()))
      .filter((n) => Number.isFinite(n));

  const normalizePractice = (r: PracticeRowCSV): PracticeRow => ({
    user_sn: toNum(r.user_sn) ?? 0,
    organization_id: toNum(r.organization_id) ?? 0,
    grade: toNum(r.grade) ?? 0,
    class: toNum(r.class) ?? 0,
    seat: toNum(r.seat) ?? 0,
    chinese_score: toNum(r.chinese_score),
    math_score: toNum(r.math_score),
    english_score: toNum(r.english_score),
    prac_sn: toNum(r.prac_sn),
    date: r.date ? new Date(r.date.replace(/-/g, "/")) : null,
    during_time: toNum(r.during_time),
    score_rate: toNum(r.score_rate),
    binary_res: splitNums(r.binary_res),
    items_ans_time: splitNums(r.items_ans_time),
    indicator_name: (r.indicator_name || "").trim(),
    subject_name: (r.subject_name || "").trim(),
  });

  const normalizeSession = (r: PracticeSessionCSV): PracticeSession => ({
  user_sn: Number(r.user_sn),
  prac_sn: Number(r.prac_sn),
  date: r.date ? new Date(r.date.replace(" ", "T")) : null,
  subject_name: (r.subject_name || "").trim(),
  indicator_name: (r.indicator_name || "").trim(),
  n_items: Number(r.n_items),
  n_correct: Number(r.n_correct),
  acc: Number(r.acc),
  avg_rt_sec: Number(r.avg_rt_sec),
});

  // AI 狀態
const [isLoading, setIsLoading] = useState(false);
const [aiData, setAiData] = useState("");
const [aiReminder, setAiReminder] = useState("");
const [aiAction, setAiAction] = useState("");


  // 載入 CSV
  useEffect(() => {
    Papa.parse<PracticeRowCSV>(CSV_PRACTICE, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const clean = (res.data as any[]).map((r) => {
          const o: any = {};
          Object.keys(r || {}).forEach((k) => {
            const nk = (k || "").trim();
            const v = r[k];
            o[nk] = typeof v === "string" ? v.trim() : v;
          });
          return o as PracticeRowCSV;
        });
        setPracticeRows(clean.map(normalizePractice));
      },
    });

    Papa.parse<PracticeSessionCSV>(CSV_PRACTICE_SESSION, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const clean = (res.data as any[]).map((r) => {
          const o: any = {};
          Object.keys(r || {}).forEach((k) => {
            const nk = (k || "").trim();
            const v = r[k];
            o[nk] = typeof v === "string" ? v.trim() : v;
          });
          return o as PracticeSessionCSV;
        });
        setSessions(clean.map(normalizeSession));
      },
    });
  }, []);

  // 過濾登入學生資料
  const sid = Number(studentInfo?.name ?? 0);
  const currentPractice = useMemo(
    () => practiceRows.filter((r) => r.user_sn === sid),
    [practiceRows, sid]
  );
  const currentSessions = useMemo(
    () => sessions.filter((r) => r.user_sn === sid),
    [sessions, sid]
  );

  // Chart.js 資料
  const scoreTrend = {
    labels: currentSessions.map((r) => r.date?.toLocaleDateString() || ""),
    datasets: [
      {
        label: "正確率 (%)",
        data: currentSessions.map((r) => Math.round((r.acc || 0) * 100)),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.3)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const indicatorAgg = (() => {
    const map: Record<string, number[]> = {};
    currentPractice.forEach((r) => {
      if (!map[r.indicator_name]) map[r.indicator_name] = [];
      if (r.score_rate) map[r.indicator_name].push(r.score_rate);
    });
    const labels = Object.keys(map);
    const values = labels.map(
      (k) => map[k].reduce((a, b) => a + b, 0) / map[k].length
    );
    return { labels, values };
  })();

  const indicatorData = {
    labels: indicatorAgg.labels,
    datasets: [
      {
        label: "平均正確率",
        data: indicatorAgg.values,
        backgroundColor: "#10b981",
      },
    ],
  };

  const subjectDist = {
    labels: [...new Set(currentPractice.map((r) => r.subject_name))],
    datasets: [
      {
        data: [...new Set(currentPractice.map((r) => r.subject_name))].map(
          (sub) => currentPractice.filter((r) => r.subject_name === sub).length
        ),
        backgroundColor: ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa"],
      },
    ],
  };

  const timeDist = {
    labels: currentPractice.map((r) => r.date?.toLocaleDateString() || ""),
    datasets: [
      {
        label: "作答時間(秒)",
        data: currentPractice.map((r) => r.during_time || 0),
        backgroundColor: "#f59e0b",
      },
    ],
  };

   const handleAIAnalysis = async () => {
    setIsLoading(true);
    setAiData("");
    setAiReminder("");
    setAiAction("");

    try {
      // 🔹 整合完整的練習數據
      const studentReport = {
        totalPractice: currentPractice.length,
        avgAcc: currentPractice.length > 0
          ? Math.round(
              (currentPractice.reduce((sum, p) => sum + (p.score_rate || 0), 0) /
                currentPractice.length) * 100
            )
          : 0,
        avgTime: currentPractice.length > 0
          ? Math.round(
              currentPractice.reduce((sum, p) => sum + (p.during_time || 0), 0) /
                currentPractice.length
            )
          : 0,
        indicatorAccuracy: indicatorAgg.labels.map((label, i) => ({
          indicator: label,
          acc: Math.round(indicatorAgg.values[i])
        })),
        subjectDist: subjectDist.labels.map((sub, i) => ({
          subject: sub,
          count: subjectDist.datasets[0].data[i]
        })),
        scoreTrend: currentSessions.map((r) => ({
          date: r.date?.toLocaleDateString() || "",
          acc: Math.round((r.acc || 0) * 100),
        })),
      };

      // 🔹 提示詞：包含完整 JSON 報表
      const prompt = `
      你是一位教學助理，請根據以下學生的練習表現數據，輸出 JSON 格式的回覆：
      ${JSON.stringify(studentReport, null, 2)}

      請回覆純 JSON（不要多餘文字），格式如下：
      {
        "數據分析": "簡短說明數據狀況",
        "學習提醒": "給學生的一句提醒",
        "行動建議": "學生下一步該做什麼"
      }
      `;

      // 🔹 呼叫 OpenAI API
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      let content = data.choices?.[0]?.message?.content || "{}";

      // 🔹 嘗試擷取 JSON 區塊
      const match = content.match(/\{[\s\S]*\}/);
      if (match) content = match[0];

      const parsed = JSON.parse(content);
      setAiData(parsed["數據分析"] || "⚠️ 無法取得數據分析");
      setAiReminder(parsed["學習提醒"] || "⚠️ 無法取得學習提醒");
      setAiAction(parsed["行動建議"] || "⚠️ 無法取得行動建議");
    } catch (err) {
      console.error("AI request error:", err);
      setAiData("⚠️ 取得 AI 分析失敗");
      setAiReminder("⚠️ 取得 AI 分析失敗");
      setAiAction("⚠️ 取得 AI 分析失敗");
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <div className="bg-gradient-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-background border-b border-border/20 mb-4 -mx-4 -mt-8 px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    練習表現分析
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">總練習次數</CardTitle>
                <div className="text-4xl font-bold text-foreground mb-0">{currentPractice.length} 次</div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  本週活躍
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">平均正確率</CardTitle>
                <div className="text-4xl font-bold text-foreground mb-0">
                {currentPractice.length > 0 
                  ? Math.round((currentPractice.reduce((sum, p) => sum + (p.score_rate || 0), 0) / currentPractice.length))
                  : 0}%
              </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Target className="w-3 h-3 mr-1" />
                  表現良好
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">平均作答時間</CardTitle>
                <div className="text-4xl font-bold text-foreground mb-0">
                {currentPractice.length > 0 
                  ? Math.round((currentPractice.reduce((sum, p) => sum + (p.during_time || 0), 0) / currentPractice.length))
                  : 0} 秒
              </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  <Clock className="w-3 h-3 mr-1" />
                  效率良好
                </Badge>
              </div>
            </CardContent>
          </Card>

          
        </div>

        {/* 主要圖表區域 - 2+2+1 佈局 */}
        <div className="space-y-8 mb-12">
          {/* 第一行：兩個次要圖表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 指標平均正確率 */}
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-elevated hover:shadow-glow transition-smooth relative">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  {/* 左側：標題 */}
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">指標平均正確率</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">各項能力指標表現</p>
                    </div>
                  </div>

                  {/* 右側：icon 區 */}
                  <div className="flex items-center gap-3">
                    {/* 問號 */}
                    <div className="relative group">
                      <button className="p-2 rounded-full bg-muted/20 hover:bg-muted/30">
                        <span className="sr-only">說明</span>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-muted-foreground"
                            viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd"
                                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-1a1 1 0 112 0v1a1 1 0 11-2 0V9zm1 5a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd" />
                        </svg>
                      </button>
                      {/* 資訊框 */}
                      <div className="absolute right-0 mt-2 w-72 p-3 text-xs rounded-md bg-black/90 text-white leading-relaxed opacity-0 group-hover:opacity-100 transition">
                        <p>
                          說明待補充
                        </p>
                      </div>
                    </div>

                    
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <Bar
                    data={indicatorData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: '#333',
                          borderWidth: 1,
                        }
                      },
                      scales: {
                        x: { 
                          grid: { color: 'rgba(0,0,0,0.1)' },
                          ticks: { color: '#666' }
                        },
                        y: { 
                          grid: { color: 'rgba(0,0,0,0.1)' },
                          ticks: { color: '#666' }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 科目分布 */}            
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-elevated hover:shadow-glow transition-smooth relative">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  {/* 左側：標題 */}
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">科目分布</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">練習科目比例分析</p>
                    </div>
                  </div>

                  {/* 右側：icon 區 */}
                  <div className="flex items-center gap-3">
                    {/* 問號 */}
                    <div className="relative group">
                      <button className="p-2 rounded-full bg-muted/20 hover:bg-muted/30">
                        <span className="sr-only">說明</span>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-muted-foreground"
                            viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd"
                                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-1a1 1 0 112 0v1a1 1 0 11-2 0V9zm1 5a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd" />
                        </svg>
                      </button>
                      {/* 資訊框 */}
                      <div className="absolute right-0 mt-2 w-72 p-3 text-xs rounded-md bg-black/90 text-white leading-relaxed opacity-0 group-hover:opacity-100 transition">
                        <p>
                          說明待補充
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </CardHeader>  
              <CardContent>
                <div className="h-[250px]">
                  <Pie
                    data={subjectDist}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { 
                          position: 'bottom',
                          labels: { 
                            color: '#666',
                            padding: 20,
                            font: { size: 12 }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: '#333',
                          borderWidth: 1,
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 第三行：作答時間分布 */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-elevated hover:shadow-glow transition-smooth relative">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  {/* 左側：標題 */}
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">作答時間分布</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">每次練習的時間花費分析</p>
                    </div>
                  </div>

                  {/* 右側：icon 區 */}
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      {/* 問號
                      <button className="p-2 rounded-full bg-muted/20 hover:bg-muted/30">
                        <span className="sr-only">說明</span>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-muted-foreground"
                            viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd"
                                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-1a1 1 0 112 0v1a1 1 0 11-2 0V9zm1 5a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd" />
                        </svg>
                      </button>
                      {/* 資訊框 
                      <div className="absolute right-0 mt-2 w-72 p-3 text-xs rounded-md bg-black/90 text-white leading-relaxed opacity-0 group-hover:opacity-100 transition">
                        <p>
                          說明待補充
                        </p>
                      </div> */}

                    {/* AI 建議按鈕 */}
                    <button
                      className="p-2 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
                    >
                      <Brain className="w-5 h-5" />
                    </button> 
                    </div>
                  </div>
                </div>
              </CardHeader>  
            <CardContent>
              <div className="h-[300px]">
                <Bar
                  data={timeDist}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#333',
                        borderWidth: 1,
                      }
                    },
                    scales: {
                      x: { 
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: { color: '#666' }
                      },
                      y: { 
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: { color: '#666' }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 正確率趨勢 */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-elevated">
          <CardHeader>
            <CardTitle>正確率趨勢</CardTitle>
            <p className="text-sm text-muted-foreground">每次練習的正確率變化</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line
                data={scoreTrend}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: { label: (ctx) => `${ctx.raw}%` },
                    },
                  },
                  scales: {
                    y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        

      </div>
    </div>
  );
}

