import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudent } from "@/contexts/StudentContext";
import { BookOpen, Play, Calculator } from "lucide-react";
import Papa from "papaparse";
import { PenTool, Info, Menu, Award, Target, Clock, TrendingUp, BarChart3, HelpCircle } from "lucide-react";
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


  // ---------- Chart.js data（從實際 CSV 映射） ----------
  // 影片練習區
  const subjectScores = {
    labels: ["國文", "數學", "英文"],
    datasets: [
      {
        label: "分數",
        data: [
          currentPractice[0]?.chinese_score || 0,
          currentPractice[0]?.math_score || 0,
          currentPractice[0]?.english_score || 0,
        ],
        backgroundColor: ["#f87171", "#60a5fa", "#34d399"],
      },
    ],
  };

  const scoreTrend = {
    labels: currentPractice.map((r) => r.date?.toLocaleDateString() || ""),
    datasets: [
      {
        label: "正確率",
        data: currentPractice.map((r) => r.score_rate || 0),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.3)",
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


// 儀表板圖表顯示
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6">
      {/* 0. 學生資訊＋各科成績表現 */}
        <div className="bg-card rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">學生資訊</h2>
              <p className="text-sm text-muted-foreground"></p>
            </div>
          </div>
          
          {/* 學生基本資料 */}
          <div className="bg-background rounded-lg p-6 mb-6 border border-border">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex-shrink-0">
                <img 
                  src="/src/assets/student-avatar.jpg" 
                  alt="Student Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/src/assets/student-avatar.png';
                  }}
                />
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-foreground mb-4">
                  {studentInfo?.name || "學生姓名"}
                </h1>

                <div className="flex flex-wrap gap-16 text-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">學號：</span>
                    <span className="font-medium">{studentInfo?.id || "ID"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">年級：</span>
                    <span className="font-medium">{studentInfo?.grade || "年級"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">班級：</span>
                    <span className="font-medium">{studentInfo?.class || "班級"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">座號：</span>
                    <span className="font-medium">{studentInfo?.seat || "座號"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 各科成績表現 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* 國文 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="text-sm text-blue-600 font-medium">國文成績</div>
              <div className="text-2xl font-bold text-blue-600">
                {studentInfo?.chineseScore ?? "--"} 分
              </div>
            </div>

            {/* 數學 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="text-sm text-blue-600 font-medium">數學成績</div>
              <div className="text-2xl font-bold text-blue-600">
                {studentInfo?.mathScore ?? "--"} 分
              </div>
            </div>

            {/* 英文 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="text-sm text-blue-600 font-medium">英文成績</div>
              <div className="text-2xl font-bold text-blue-600">
                {studentInfo?.englishScore ?? "--"} 分
              </div>
            </div>

            {/* 待加強科目 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div className="text-sm text-red-600 font-medium">待加強科目</div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const weakSubjects: string[] = [];

                  if ((studentInfo?.chineseScore ?? 100) < 60) weakSubjects.push("國文");
                  if ((studentInfo?.mathScore ?? 100) < 60) weakSubjects.push("數學");
                  if ((studentInfo?.englishScore ?? 100) < 60) weakSubjects.push("英文");

                  return weakSubjects.length > 0 ? (
                    weakSubjects.map((subj) => (
                      <span
                        key={subj}
                        className="px-3 py-1 rounded-md bg-red-600 text-white text-sm font-semibold"
                      >
                        {subj}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">無</span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 1. 練習表現區 */}
        <div className="bg-card rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">練習表現區</h2>
              <p className="text-sm text-muted-foreground">本週練習成績趨勢</p>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20">
                    <Info className="w-10 h-10 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看練習表現的詳細統計，包含成績趨勢、題型分析和完成進度</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20"
                asChild
              >
                <Link to="/student-dashboard/practice">
                  <Menu className="w-10 h-10 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1.1 總練習次數 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">總練習次數</h3>
              <div className="text-4xl font-bold text-primary mb-2">{currentPractice.length || 0}</div>
              <p className="text-sm text-muted-foreground">本週累積</p>
            </div>

            {/* 1.2 平均正確率 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">平均正確率</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                {currentPractice.length > 0 
                  ? Math.round((currentPractice.reduce((sum, p) => sum + (p.score_rate || 0), 0) / currentPractice.length)) 
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">整體表現</p>
            </div>

            {/* 1.3 學習時間 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">作答時間</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                {currentPractice.length > 0 
                  ? Math.round((currentPractice.reduce((sum, p) => sum + (p.during_time || 0), 0) / currentPractice.length))
                  : 0} 秒
              </div>
              <p className="text-sm text-muted-foreground">平均每次</p>
            </div>
          </div>
        </div> 

        {/* 2. 測驗答題區 */}
        <div className="bg-card rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">測驗答題區</h2>
              <p className="text-sm text-muted-foreground">各科目測驗成績</p>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20">
                    <Info className="w-10 h-10 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看各科目測驗成績、月度趨勢和答題準確率詳細分析</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20"
                asChild
              >
                <Link to="/Student_practice">
                  <Menu className="w-10 h-10 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2.1 各科成績 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">各科成績</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>

            </div>

            {/* 2.2 成績趨勢 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">月度趨勢</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>

            {/* 2.3 答題準確率 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">答題準確率</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>
          </div>
        </div> 

        {/* 3. 影片瀏覽區 */}
        <div className="bg-card rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">影片瀏覽區</h2>
              <p className="text-sm text-muted-foreground">影片觀看進度</p>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20">
                    <Info className="w-10 h-10 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看影片觀看進度、每日觀看時間和影片分類統計</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20"
                asChild
              >
                <Link to="/Student_practice">
                  <Menu className="w-10 h-10 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 3.1 觀看進度 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">觀看進度</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
                </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>

            {/* 3.2 每日觀看時間 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">每日觀看時間</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>

            {/* 3.3 影片分類統計 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">影片分類統計</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>
          </div>
        </div> 

        {/* 4. 英文單字區 */}
        <div className="bg-card rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">英文單字區</h2>
              <p className="text-sm text-muted-foreground">單字學習進度</p>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20">
                    <Info className="w-10 h-10 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看單字學習進度、學習趨勢和錯誤類型分析</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20"
                asChild
              >
                <Link to="/Student_practice">
                  <Menu className="w-10 h-10 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 4.1 單字學習進度 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">單字學習進度</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
                </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>

            {/* 4.2 學習趨勢 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">學習趨勢</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>

            {/* 4.3 錯誤題型分析 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">錯誤題型</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>
          </div>
        </div> 

        {/* 5. 數學測驗區 */}
        <div className="bg-card rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">數學測驗區</h2>
              <p className="text-sm text-muted-foreground">數學能力評估</p>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20">
                    <Info className="w-10 h-10 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看數學測驗難度分析、主題表現和正確率統計</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 p-0 hover:bg-primary/10 relative z-20"
                asChild
              >
                <Link to="/Student_practice">
                  <Menu className="w-10 h-10 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 5.1 難度分析 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">難度分析</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
                </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>

            {/* 5.2 主題表現 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">主題表現</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>

            {/* 5.3 正確率統計 */}
            <div className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-foreground mb-2">正確率統計</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ?
              </div>
              <p className="text-sm text-muted-foreground"></p>
            </div>
          </div>
           
        </div> 
      </div>
    </div>
);
}
