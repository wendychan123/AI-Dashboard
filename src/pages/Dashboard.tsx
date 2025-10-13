import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudent } from "@/contexts/StudentContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, Play, Calculator } from "lucide-react";
import Papa from "papaparse";
import { PenTool, Info, Menu, Award, Target, Clock, TrendingUp, BarChart3, HelpCircle, Home, Brain, FileText, BookOpenCheck, Bot } from "lucide-react";
import { Line, Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Chart from "chart.js/auto";
import ReactMarkdown from "react-markdown";
import GaugeChart from "react-gauge-chart";
import remarkGfm from "remark-gfm";

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

// 五個資料表的 URL
const CSV_PRACTICE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjuUAxurul4du6S5xU8G8EPICQXTahTlI3wdu3Ts79IKIpYN8dumxLnXdrwr_p0Mg-3q3zUI6K1AvD/pub?gid=710180589&single=true&output=csv";
const CSV_TEST = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2T-FvT_sR4ycbOTGpOF5colwjyUMkoudJIDBXBMn7HErI5QpNjFbAjQEWUGTCbddmz0lRgEBZHYDh/pub?gid=495356082&single=true&output=csv";
const CSV_VIDEO = "";
const CSV_VOCAB = "";
const CSV_MATH = "";

// 對應資料表資料結構
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

interface TestRowCSV {
  user_sn: string;
  sn: string;
  action_time: string;
  object_type: string;
  result_duration: string;
  result_success: string;
  mission_id: string;
  question_id: string;
}

interface TestRow {
  user_sn: number;
  sn: number;
  action_time: Date | null;
  object_type: string;
  result_duration: string;
  result_success: string;
  mission_id: string;
  question_id: string;
}
interface VideoRow {
  user_sn: string;
  video_name: string;
  finish_rate: string;
}

interface MathRow {
  user_sn: string;
  unit_name: string;
  is_correct: string; 
}

export default function Dashboard() {
  const { studentInfo } = useStudent();
  const [practiceRows, setPracticeRows] = useState<PracticeRow[]>([]);
  const [testRows, setTestRows] = useState<TestRow[]>([]);
  const [videoRows, setVideoRows] = useState<VideoRow[]>([]);
  const [mathRows, setMathRows] = useState<MathRow[]>([]);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const activityRef = useRef<HTMLCanvasElement>(null);
  const [totalMissions, setTotalMissions] = useState(0);
  const [accRate, setAccRate] = useState(0);
  

  // ---------- 共用函式 ----------
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

  // ---------- CSV 載入 ----------
  const loadPracticeCSV = (url: string, setData: (data: PracticeRow[]) => void) => {
    if (!url) {
      setData([]);
      return;
    }
    Papa.parse<PracticeRowCSV>(url, {
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
        setData(clean.map(normalizePractice));
      },
      error: () => setData([]),
    });
  };

  const loadCSV = <T,>(url: string, setData: (data: T[]) => void) => {
    if (!url) {
      setData([]);
      return;
    }
    Papa.parse<T>(url, {
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
          return o as T;
        });
        setData(clean);
      },
      error: () => setData([]),
    });
  };

  //學習氛圍
  // AI 產出內容
  const [aiSummary, setAiSummary] = useState("請選擇一個圖表進行分析。");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // 🔹 控制彈窗開關
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeChart, setActiveChart] = useState<"radar" | "activity" | null>(null);


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
  // 🟦 建立雷達圖
useEffect(() => {
  if (radarRef.current) {
    const radarChart = new Chart(radarRef.current, {
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
    return () => radarChart.destroy();
  }
}, []);

// 🟩 建立活躍度趨勢圖
useEffect(() => {
  if (activityRef.current) {
    const activityChart = new Chart(activityRef.current, {
      type: "line",
      data: {
        labels: ["六週前", "五週前", "四週前", "三週前", "二週前", "上週"],
        datasets: [
          {
            label: "個人活躍度",
            data: studentData.activity,
            borderColor: "rgba(74,144,226,1)",
            backgroundColor: "rgba(74,144,226,0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "班級平均活躍度",
            data: classData.activity_avg,
            borderColor: "rgba(80,227,194,1)",
            backgroundColor: "rgba(80,227,194,0.1)",
            fill: true,
            borderDash: [5, 5],
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "學習活動次數" },
          },
        },
      },
    });
    return () => activityChart.destroy();
  }
}, []);

  const maxValues = {
    practice: 250,
    quiz: 150,
    video: 100,
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

  // 🟩 載入測驗答題 CSV
  Papa.parse<TestRowCSV>(CSV_TEST, {
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
        return o as TestRowCSV;
      });

      // 正規化
      const toNum = (v: any): number | null => {
        const n = Number(String(v ?? "").trim());
        return Number.isFinite(n) ? n : null;
      };

      const normalizeTest = (r: TestRowCSV): TestRow => {
        let parsedDate: Date | null = null;
        if (r.action_time) {
          let cleanTime = r.action_time.replace(" ", "T").replace(/\+\d{2}:\d{2}$/, "");
          const d = new Date(cleanTime);
          parsedDate = isNaN(d.getTime()) ? null : d;
        }
        return {
          user_sn: toNum(r.user_sn) ?? 0,
          sn: toNum(r.sn) ?? 0,
          action_time: parsedDate,
          object_type: (r.object_type || "").trim(),
          result_duration: (r.result_duration || "").trim(),
          result_success: (r.result_success || "").trim(),
          mission_id: (r.mission_id || "").trim(),
          question_id: (r.question_id || "").trim(),
        };
      };

      const normalized = clean.map(normalizeTest);
      setTestRows(normalized);
    },
  });


// 呼叫 Gemini API
  const handleAiAnalysis = async (type: "radar" | "activity") => {
    // 根據類型切換對應 loading
    if (type === "radar") setLoadingRadar(true);
    if (type === "activity") setLoadingActivity(true);

    try {
      const prompt =
        type === "radar"
          ? `以下是學生與班級的學習表現：
              練習表現：${studentData.practice} (班平均 ${classData.practice_avg})
              測驗答題：${studentData.quiz} (班平均 ${classData.quiz_avg})
              影片瀏覽：${studentData.video} (班平均 ${classData.video_avg})
              英文單字：${studentData.vocab} (班平均 ${classData.vocab_avg})
              數學測驗：${studentData.math} (班平均 ${classData.math_avg})
              `
          : `學生最近六週的學習活躍度： 
              學生活躍度（週次由舊到新）：${studentData.activity.join("、")} 
              班級平均活躍度：${classData.activity_avg.join("、")}。
              `;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:`
              你是一位教育數據分析專家，負責根據學生學習數據提供簡潔、具體的分析建議。
              請嚴格依照以下格式輸出，且不要出現開場白或稱謂（如「同學你好」等）：

              **數據分析**
              - 說明數據呈現的主要趨勢或異常
              - 指出學習表現的關鍵指標
              - 避免冗長說明，每點不超過 30 字

              **學習提醒**
              - 提出 3~5 點具體提醒（學習態度、節奏、專注度）
              - 每點建議以簡潔語句呈現
              - 避免冗長說明，每點不超過 30 字

              **行動建議**
              - 提出具體可執行的行動（如練習策略、時間規劃、學習方法）
              - 鼓勵正向改進，給出清晰方向
              - 每點不超過 30 字

              請使用 Markdown 條列式輸出。
              `
                ,
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await response.json();
      setAiSummary(data.reply || "⚠️ 沒有收到 Gemini 回覆。");
      setActiveChart(type);
      setOpen(true); // 
    } catch (error: any) {
      setAiSummary(`❌ 錯誤：${error.message}`);
    } finally {
      if (type === "radar") setLoadingRadar(false);
      if (type === "activity") setLoadingActivity(false);
    }
  };





  // 載入五個資料集
  useEffect(() => {
    loadPracticeCSV(CSV_PRACTICE, setPracticeRows);
    loadCSV<TestRow>(CSV_TEST, setTestRows);
    loadCSV<VideoRow>(CSV_VIDEO, setVideoRows);
    loadCSV<MathRow>(CSV_MATH, setMathRows);
  }, []);



  // ---------- 過濾登入學生 ----------
  const sid = Number(studentInfo?.name ?? 0);  // 用 name 當 user_sn
  const currentPractice = useMemo(
    () => practiceRows.filter((r) => r.user_sn === sid),
    [practiceRows, sid]
  );
    const currentTests = useMemo(
    () => testRows.filter((r) => r.user_sn === sid),
    [testRows, sid]
  );

  // 儀表板圖表顯示
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 🔹 第一列：雷達圖與活躍度圖（手機垂直、平板橫向） */}
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
          {/* 雷達圖 */}
          <Card className="shadow-sm hover:shadow-md transition">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-semibold">
                學習氛圍雷達圖
              </CardTitle>
              <button
                onClick={() => handleAiAnalysis("radar")}
                disabled={loadingRadar}
                className="p-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 transition"
              >
                {loadingRadar ? "分析中..." : <Bot className="w-4 h-4" />}
              </button>
            </CardHeader>
            <CardContent className="h-[280px] sm:h-[350px] md:h-[420px]">
              <canvas ref={radarRef}></canvas>
            </CardContent>
          </Card>

          {/* 活躍度 */}
          <Card className="shadow-sm hover:shadow-md transition">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-semibold">
                每週學習活躍度趨勢
              </CardTitle>
              <button
                onClick={() => handleAiAnalysis("activity")}
                disabled={loadingActivity}
                className="p-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 transition"
              >
                {loadingActivity ? "分析中..." : <Bot className="w-4 h-4" />}
              </button>
            </CardHeader>
            <CardContent className="h-[280px] sm:h-[350px] md:h-[420px]">
              <canvas ref={activityRef}></canvas>
            </CardContent>
          </Card>
        </div>

        {/* AI 建議彈窗 */}
        <DialogContent className="max-w-[95vw] sm:max-w-3xl bg-white rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">
            {activeChart === "radar"
              ? "AI 建議：學習氛圍雷達圖"
              : "AI 建議：每週學習活躍度趨勢"}
          </DialogTitle>
        </DialogHeader>

        {/* 讓長內容可捲動顯示完整文字 */}
        <div className="max-h-[70vh] overflow-y-auto mt-4 px-1 sm:px-2">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-gray-800 mt-4 mb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-gray-700 mt-3 mb-1">
                  {children}
                </h2>
              ),
              p: ({ children }) => (
                <p className="mb-2 text-gray-700 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc ml-6 text-gray-700 space-y-1">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
            }}
          >
            {aiSummary}
          </ReactMarkdown>
        </div>
      </DialogContent>

      </Dialog>



      {/* 🔹 第二列：學習指標儀表 */}
      <Card className="p-2 sm:p-1">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold">
            學習指標表現等級
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(maxValues).map(([key, max]) => {
            const value = (studentData as any)[key];
            const percent = Math.min(value / max, 1);
            const hint =
              percent >= 0.8
                ? "表現傑出，繼續保持！"
                : percent >= 0.4
                ? "表現合格，穩定進步中！"
                : "仍有進步空間，加油！";
            const hintColor =
              percent >= 0.8
                ? "text-green-600"
                : percent >= 0.4
                ? "text-yellow-600"
                : "text-red-600";
            return (
              <div key={key} className="text-center">
                <p className={`mb-2 text-xs sm:text-sm font-medium ${hintColor}`}>
                  {hint}
                </p>
                <div className="h-[100px] sm:h-[120px] relative">
                  <GaugeChart
                    id={`gauge-${key}`}
                    nrOfLevels={20}
                    percent={percent}
                    colors={["#FF5F6D", "#FFC371", "#4CAF50"]}
                    arcWidth={0.3}
                    hideText
                  />
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

      {/* 🔹 各項數據詳情與差異分析 */}
      <div className="mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 練習表現 */}
          <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">練習表現</h3>
                <p className="text-sm text-gray-500 mt-1">
                  您：{studentData.practice} 次 ｜ 班級平均：{classData.practice_avg} 次
                </p>
              </div>
              <Link to="/student-dashboard/practice">
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition"
                >
                  <BarChart3 className="w-4 h-4 text-primary" />
                </Button>
              </Link>
            </div>

            {/* 長條比較圖 */}
            <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden mb-4">
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-green-400 opacity-40"
                style={{ width: `${(classData.practice_avg / maxValues.practice) * 100}%` }}
              ></div>
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-blue-500"
                style={{ width: `${(studentData.practice / maxValues.practice) * 100}%` }}
              ></div>
            </div>

            {/* 子統計 */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-slate-50 rounded-lg p-3 border text-center">
                
                <p className="text-xs font-semibold text-slate-700">次數</p>
                <p className="text-xl font-bold text-blue-600">
                  {currentPractice.length || 0}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                
                <p className="text-xs font-semibold text-slate-700">正確率</p>
                <p className="text-xl font-bold text-blue-600">
                  {currentPractice.length > 0
                    ? Math.round(
                        currentPractice.reduce(
                          (sum, p) => sum + (p.score_rate || 0),
                          0
                        ) / currentPractice.length
                      )
                    : 0}
                  %
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border text-center">
                
                <p className="text-xs font-semibold text-slate-700">時間</p>
                <p className="text-xl font-bold text-blue-600">
                  {currentPractice.length > 0
                    ? Math.round(
                        currentPractice.reduce(
                          (sum, p) => sum + (p.during_time || 0),
                          0
                        ) / currentPractice.length /
                        60
                      )
                    : 0}
                  分
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-center text-green-600">
              表現優異！繼續保持！
            </p>
          </Card>

          {/* 測驗答題 */}
          <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
            {/* 標題列 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">測驗答題</h3>
                <p className="text-sm text-gray-500 mt-1">
                  您：{studentData.quiz} 題 ｜ 班級平均：{classData.quiz_avg} 題
                </p>
              </div>
              <Link to="/student-dashboard/quiz">
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition"
                >
                  <BarChart3 className="w-4 h-4 text-primary" />
                </Button>
              </Link>
            </div>

            {/* 進度條 */}
            <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden mb-6">
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-green-400 opacity-40"
                style={{ width: `${(classData.quiz_avg / maxValues.quiz) * 100}%` }}
              ></div>
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-blue-500"
                style={{ width: `${(studentData.quiz / maxValues.quiz) * 100}%` }}
              ></div>
            </div>

            {/* 子統計卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 總測驗數 */}

              <div className="bg-slate-50 rounded-lg p-3 border text-center">
                <p className="text-xs font-semibold text-slate-700">總測驗數</p>
                <p className="text-xl font-bold text-blue-600">
                   {totalMissions} 份
                </p>
              </div>
              
               {/* 整體答對率 */}
              <div className="bg-slate-50 rounded-lg p-3 border text-center">
                <p className="text-xs font-semibold text-slate-700">整體答對率</p>
                <p className="text-xl font-bold text-blue-600">
                   {accRate}%
                </p>
              </div>
              
             
            </div>
</Card>


          {/* 影片瀏覽 */}
          <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">影片瀏覽</h3>
                <p className="text-sm text-gray-500 mt-1">
                  您：{studentData.video} 次 ｜ 班級平均：{classData.video_avg} 次
                </p>
              </div>
              <Link to="/student-dashboard/video">
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition"
                >
                  <BarChart3 className="w-4 h-4 text-primary" />
                </Button>
              </Link>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden mb-4">
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-green-400 opacity-40"
                style={{ width: `${(classData.video_avg / maxValues.video) * 100}%` }}
              ></div>
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-blue-500"
                style={{ width: `${(studentData.video / maxValues.video) * 100}%` }}
              ></div>
            </div>

            {/* 子統計 */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-slate-50 rounded-lg p-3 border text-center">
                <PenTool className="w-4 h-4 mx-auto text-slate-600 mb-1" />
                <p className="text-xs font-semibold text-slate-700">瀏覽影片數</p>
                <p className="text-xl font-bold text-blue-600">
                  
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                <Target className="w-4 h-4 mx-auto text-slate-600 mb-1" />
                <p className="text-xs font-semibold text-slate-700">平均完成率</p>
                <p className="text-xl font-bold text-blue-600">
                  
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border text-center">
                <PenTool className="w-4 h-4 mx-auto text-slate-600 mb-1" />
                <p className="text-xs font-semibold text-slate-700">最專注科目</p>
                <p className="text-xl font-bold text-blue-600">
                  
                </p>
              </div>

              
            </div>

            <div className="text-center mt-3">
              <p
                className={`text-base font-semibold ${
                  studentData.video >= classData.video_avg
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {studentData.video >= classData.video_avg
                  ? `高於班級平均 ${studentData.video - classData.video_avg} 次`
                  : `低於班級平均 ${classData.video_avg - studentData.video} 次`}
              </p>
            </div>
          </Card>

          {/* 數學測驗 */}
          <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">數學測驗</h3>
                <p className="text-sm text-gray-500 mt-1">
                  您：{studentData.math} 題 ｜ 班級平均：{classData.math_avg} 題
                </p>
              </div>
              <Link to="/student-dashboard/math">
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition"
                >
                  <BarChart3 className="w-4 h-4 text-primary" />
                </Button>
              </Link>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden mb-4">
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-green-400 opacity-40"
                style={{ width: `${(classData.math_avg / maxValues.math) * 100}%` }}
              ></div>
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-blue-500"
                style={{ width: `${(studentData.math / maxValues.math) * 100}%` }}
              ></div>
            </div>

            <div className="text-center mt-3">
              <p
                className={`text-base font-semibold ${
                  studentData.math >= classData.math_avg
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {studentData.math >= classData.math_avg
                  ? `高於班級平均 ${studentData.math - classData.math_avg} 題`
                  : `低於班級平均 ${classData.math_avg - studentData.math} 題`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                📊 建議針對錯題加強練習，提升正確率。
              </p>
            </div>
          </Card>
        </div>
      </div> 
    </div>   
  );
}
