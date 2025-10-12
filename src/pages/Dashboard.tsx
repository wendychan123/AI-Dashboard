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
const CSV_TEST = "";
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

interface TestRow {
  user_sn: string;
  subject: string;
  score: string;
}
interface VideoRow {
  user_sn: string;
  video_name: string;
  finish_rate: string;
}
interface VocabRow {
  user_sn: string;
  word: string;
  is_correct: string; 
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
  const [vocabRows, setVocabRows] = useState<VocabRow[]>([]);
  const [mathRows, setMathRows] = useState<MathRow[]>([]);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const activityRef = useRef<HTMLCanvasElement>(null);
  

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
              請提供「數據解析、學習提醒、行動建議」三段式建議。`
          : `以下是學生最近六週的學習活躍度：
              ${studentData.activity.join("、")}
              班級平均為 ${classData.activity_avg.join("、")}。
              請提供「數據解析、學習提醒、行動建議」三段式建議。`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "你是一個學習助理，請根據圖表數據給出簡潔的建議，以 Markdown 條列式輸出。",
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
    loadCSV<VocabRow>(CSV_VOCAB, setVocabRows);
    loadCSV<MathRow>(CSV_MATH, setMathRows);
  }, []);


  // ---------- 過濾登入學生 ----------
  const sid = Number(studentInfo?.name ?? 0);  // 用 name 當 user_sn
  const currentPractice = useMemo(
    () => practiceRows.filter((r) => r.user_sn === sid),
    [practiceRows, sid]
  );

  // 儀表板圖表顯示
  return (
    <div className="w-full max-w-[1350px] mx-auto space-y-3">
      {/* Top Section - Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> </div>
      <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-4 py-4">
              {/* 雷達圖 + 活躍度趨勢 */}
              <Dialog open={open} onOpenChange={setOpen}>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* 雷達圖卡片 */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>學習氛圍雷達圖</CardTitle>
                      <button
                        onClick={() => handleAiAnalysis("radar")}
                        disabled={loadingRadar}
                        className="p-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 transition"
                      >
                        {loadingRadar ? "分析中..." : <Bot className="w-4 h-4" />}
                      </button>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <canvas ref={radarRef}></canvas>
                    </CardContent>
                  </Card>

                  {/* 活躍度趨勢卡片 */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>每週學習活躍度趨勢</CardTitle>
                      <button
                        onClick={() => handleAiAnalysis("activity")}
                        disabled={loadingActivity}
                        className="p-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 transition"
                      >
                        {loadingActivity ? "分析中..." : <Bot className="w-4 h-4" />}
                      </button>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <canvas ref={activityRef}></canvas>
                    </CardContent>
                  </Card>
                </div>

                {/* AI 分析彈窗 */}
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {activeChart === "radar"
                        ? "AI 建議：學習氛圍雷達圖"
                        : "AI 建議：活躍度趨勢"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto mt-2 prose prose-sm dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 text-gray-700 leading-relaxed">{children}</p>
                        ),
                        li: ({ children }) => <li className="list-disc ml-5">{children}</li>,
                      }}
                    >
                      {aiSummary}
                    </ReactMarkdown>
                  </div>
                </DialogContent>
              </Dialog>


              {/* 指標 Gauges */}
              <Card className="mb-10">
                <CardHeader>
                  <CardTitle>學習指標表現等級</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
  

      
      
             {/* 各項數據詳情與差異分析 */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">

                {/* 練習表現卡片 */}
                <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">練習表現</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        您：{studentData.practice} 次 ｜ 班級平均：{classData.practice_avg} 次
                      </p>
                    </div>
                    <Link to="/student-dashboard/practice">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition flex items-center justify-center"
                      >
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </Button>
                    </Link>
                  </div>

                  <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden mb-6">
                    <div
                      className="absolute top-0 left-0 h-3 rounded-full bg-green-400 opacity-40"
                      style={{ width: `${(classData.practice_avg / maxValues.practice) * 100}%` }}
                    ></div>
                    <div
                      className="absolute top-0 left-0 h-3 rounded-full bg-blue-500"
                      style={{ width: `${(studentData.practice / maxValues.practice) * 100}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3 border text-center">
                      <PenTool className="w-4 h-4 mx-auto text-slate-600 mb-1" />
                      <p className="text-xs font-semibold text-slate-700">次數</p>
                      <p className="text-base font-bold text-slate-800">
                        {currentPractice.length || 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                      <Target className="w-4 h-4 mx-auto text-slate-600 mb-1" />
                      <p className="text-xs font-semibold text-slate-700">正確率</p>
                      <p className="text-base font-bold text-slate-800">
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
                      <Clock className="w-4 h-4 mx-auto text-slate-600 mb-1" />
                      <p className="text-xs font-semibold text-slate-700">時間</p>
                      <p className="text-base font-bold text-slate-800">
                        {currentPractice.length > 0
                          ? Math.round(
                              currentPractice.reduce(
                                (sum, p) => sum + (p.during_time || 0),
                                0
                              ) / currentPractice.length / 60
                            )
                          : 0}
                        分
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-sm font-medium text-center text-green-600">
                    表現優異！繼續保持！
                  </p>
                </Card>

                {/* 測驗答題卡片 */}
                <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">測驗答題</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        您：{studentData.quiz} 題 ｜ 班級平均：{classData.quiz_avg} 題
                      </p>
                    </div>
                    <Link to="/student-dashboard/quiz">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition flex items-center justify-center"
                      >
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </Button>
                    </Link>
                  </div>

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

                  <div className="text-center mt-3">
                    <p className="text-base font-semibold text-blue-600">
                      高於班級平均 {studentData.quiz - classData.quiz_avg} 題
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      🌟 答題穩定，維持良好作答節奏。
                    </p>
                  </div>
                </Card>

                {/* 影片瀏覽卡片 */}
                <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">影片瀏覽</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        您：{studentData.video} 次 ｜ 班級平均：{classData.video_avg} 次
                      </p>
                    </div>
                    <Link to="/student-dashboard/video">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition flex items-center justify-center"
                      >
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </Button>
                    </Link>
                  </div>

                  <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden mb-6">
                    <div
                      className="absolute top-0 left-0 h-3 rounded-full bg-green-400 opacity-40"
                      style={{ width: `${(classData.video_avg / maxValues.video) * 100}%` }}
                    ></div>
                    <div
                      className="absolute top-0 left-0 h-3 rounded-full bg-blue-500"
                      style={{ width: `${(studentData.video / maxValues.video) * 100}%` }}
                    ></div>
                  </div>

                  <div className="text-center mt-3">
                    <p className="text-base font-semibold text-blue-600">
                      高於班級平均 {studentData.video - classData.video_avg} 次
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      🎥 學習積極，保持觀看節奏。
                    </p>
                  </div>
                </Card>

                {/* 數學測驗卡片 */}
                <Card className="p-6 shadow-sm hover:shadow-md transition border rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">數學測驗</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        您：{studentData.math} 題 ｜ 班級平均：{classData.math_avg} 題
                      </p>
                    </div>
                    <Link to="/student-dashboard/math">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition flex items-center justify-center"
                      >
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </Button>
                    </Link>
                  </div>

                  <div className="w-full bg-gray-200 h-3 rounded-full relative overflow-hidden mb-6">
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
                    <p className="text-base font-semibold text-yellow-600">
                      低於班級平均 {classData.math_avg - studentData.math} 題
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      📊 建議多練習錯題，提升解題正確率。
                    </p>
                  </div>
                </Card>

              </div>



        </div>   
      </div>
  );
}
