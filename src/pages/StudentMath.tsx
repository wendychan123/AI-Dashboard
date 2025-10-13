import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Calculator, TrendingUp } from "lucide-react";

import { useStudent } from "@/contexts/StudentContext";

// 註冊 Chart.js 元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartJsTooltip,
  Legend
);

// 🟢 你的 CSV 來源（可改成 props 或 .env）
const CSV_MATH =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-cDB5NjML4dinKwynzagTrdB4sPFAwgzADaLeUTvHUdHX7TKBEATu1lmemNKTT77_yXdI5AtGaHaC/pub?gid=1148897039&single=true&output=csv";

// ───────────────────────────────────────────────────────────────────────────────
// 型別宣告
// ───────────────────────────────────────────────────────────────────────────────
export interface MathRowCSV {
  sn?: string;
  user_sn: string;
  game_grade?: string;
  game_semester?: string;
  unit_id?: string;
  answer_problem_num?: string;
  is_correct: string;                 // 0/1
  game_time?: string;                 // 毫秒
  last_modified: string;              // "YYYY-mm-dd HH:MM:SS"
  unit_name?: string;

  // user_data 欄位
  organization_id?: string;
  grade?: string;
  class?: string;
  seat?: string;
  chinese_score?: string;
  math_score?: string;
  english_score?: string;

  // 平均答對率（小數點三位）
  is_correct_avg?: string;
}

export interface MathRow {
  sn: number | null;
  user_sn: number;
  game_grade: number | null;
  game_semester: number | null;
  unit_id: number | null;
  answer_problem_num: string;
  is_correct: 0 | 1;
  game_time_ms: number | null;
  last_modified_str: string; // 原字串
  last_modified: Date | null; // 解析後日期
  unit_name: string;

  organization_id: string;
  grade: number | null;
  class: number | null;
  seat: number | null;
  chinese_score: number | null;
  math_score: number | null;
  english_score: number | null;

  is_correct_avg: number | null;
}

// ───────────────────────────────────────────────────────────────────────────────
// 工具函式
// ───────────────────────────────────────────────────────────────────────────────
const toNum = (v: any): number | null => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};

const toInt = (v: any): number | null => {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
};

const to01 = (v: any): 0 | 1 => {
  const n = Number(String(v ?? "").trim());
  return n >= 1 ? 1 : 0;
};

const parseDateYMDHMS = (s: string | undefined | null): Date | null => {
  if (!s) return null;
  // 期待格式 "YYYY-mm-dd HH:MM:SS"
  const clean = s.replace(" ", "T");
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
};

const movingAverage = (arr: number[], k = 7): (number | null)[] => {
  const out: (number | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let cnt = 0;
    for (let j = i - k + 1; j <= i; j++) {
      if (j >= 0) {
        sum += arr[j];
        cnt++;
      }
    }
    out.push(cnt ? sum / cnt : null);
  }
  return out;
};

const fmtPct = (x: number | null | undefined, digits = 1): string => {
  if (x == null || isNaN(x)) return "-";
  return (x * 100).toFixed(digits) + "%";
};

const fmtSecs = (ms: number | null | undefined): string => {
  if (ms == null || isNaN(ms)) return "-";
  return (ms / 1000).toFixed(1) + "s";
};

// 正規化 CSV → 內部型別
const normalizeRow = (r: MathRowCSV): MathRow => {
  const lm = (r.last_modified || "").trim();
  return {
    sn: toInt(r.sn),
    user_sn: toInt(r.user_sn) ?? 0,
    game_grade: toInt(r.game_grade),
    game_semester: toInt(r.game_semester),
    unit_id: toInt(r.unit_id),
    answer_problem_num: (r.answer_problem_num || "").trim(),
    is_correct: to01(r.is_correct),
    game_time_ms: toNum(r.game_time),

    last_modified_str: lm,
    last_modified: parseDateYMDHMS(lm),
    unit_name: (r.unit_name || "").trim() || "(未命名單元)",

    organization_id: (r.organization_id || "").trim(),
    grade: toInt(r.grade),
    class: toInt(r.class),
    seat: toInt(r.seat),
    chinese_score: toNum(r.chinese_score),
    math_score: toNum(r.math_score),
    english_score: toNum(r.english_score),

    is_correct_avg: r.is_correct_avg != null ? toNum(r.is_correct_avg) : null,
  };
};

// ───────────────────────────────────────────────────────────────────────────────
// 主元件
// ───────────────────────────────────────────────────────────────────────────────
export default function StudentMath() {
  const { studentInfo } = useStudent();

  const [rows, setRows] = useState<MathRow[]>([]);
  const [unitKW, setUnitKW] = useState("");
  const [sidSelect, setSidSelect] = useState<string>(""); // 當 context 無 sid 時使用
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // 載入 CSV
  useEffect(() => {
    Papa.parse<MathRowCSV>(CSV_MATH, {
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
          return normalizeRow(o as MathRowCSV);
        });

        // 依時間排序（舊→新）
        clean.sort((a, b) => {
          const ta = a.last_modified?.getTime() ?? 0;
          const tb = b.last_modified?.getTime() ?? 0;
          return ta - tb;
        });

        setRows(clean);
        // 若 context 沒有 user_sn，預設選列表第一位
        if (!studentInfo?.name && clean.length > 0) {
          setSidSelect(String(clean[0].user_sn));
        }
      },
    });
  }, [studentInfo?.name]);

  // 目前學生 user_sn（優先用 context，否則用 sidSelect）
  const userSn = useMemo(() => {
    const fromCtx = Number(studentInfo?.name ?? 0); // 你原本的寫法：從 name 取 sid
    if (Number.isFinite(fromCtx) && fromCtx > 0) return fromCtx;
    const fromSelect = Number(sidSelect);
    return Number.isFinite(fromSelect) ? fromSelect : 0;
  }, [studentInfo?.name, sidSelect]);

  // 目前學生全筆資料
  const currentRows = useMemo(() => {
    let list = rows.filter((r) => r.user_sn === userSn);

    // 關鍵字過濾（unit_name）
    const kw = unitKW.trim().toLowerCase();
    if (kw) {
      list = list.filter((r) => r.unit_name.toLowerCase().includes(kw));
    }

    // 日期區間過濾（使用 last_modified）
    const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
    if (from) list = list.filter((r) => (r.last_modified ? r.last_modified >= from : false));
    if (to) list = list.filter((r) => (r.last_modified ? r.last_modified <= to : false));

    // 依時間排序（舊→新）
    list.sort((a, b) => {
      const ta = a.last_modified?.getTime() ?? 0;
      const tb = b.last_modified?.getTime() ?? 0;
      return ta - tb;
    });

    return list;
  }, [rows, userSn, unitKW, dateFrom, dateTo]);

  

  // KPI 計算
  const kpi = useMemo(() => {
    const n = currentRows.length;
    const correctN = currentRows.reduce((acc, r) => acc + (r.is_correct === 1 ? 1 : 0), 0);
    const acc = n ? correctN / n : NaN;
    const avgTime = n
      ? currentRows.reduce((acc, r) => acc + (r.game_time_ms ?? 0), 0) / n
      : NaN;
    const uniqUnits = new Set(currentRows.map((r) => r.unit_name));
    const profile = currentRows[0];

    return {
      n,
      acc,
      avgTime,
      unitCount: uniqUnits.size,
      profile,
    };
  }, [currentRows]);

  // 圖表資料：正確率趨勢（逐題 0/1 + 7點移動平均）
  const chartAccuracyOverTime = useMemo(() => {
    const labels = currentRows.map((r) => r.last_modified).filter(Boolean) as Date[];
    const y = currentRows.map((r) => (r.is_correct === 1 ? 1 : 0));
    const ma = movingAverage(y, 7);

    return {
      data: {
        labels,
        datasets: [
          {
            label: "正確(1)/錯誤(0)",
            data: y,
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 2,
          },
          {
            label: "7點移動平均",
            data: ma,
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false as const,
        scales: {
          x: { type: "time" as const, time: { unit: "day" as const } },
          y: { suggestedMin: 0, suggestedMax: 1, ticks: { stepSize: 0.25 } },
        },
      },
    };
  }, [currentRows]);

  // 圖表資料：單元正確率（unit_name）
const chartUnitAccuracy = useMemo(() => {
  const stat = new Map<string, { n: number; c: number }>();
  for (const r of currentRows) {
    const u = r.unit_name || "(未知單元)";
    if (!stat.has(u)) stat.set(u, { n: 0, c: 0 });
    const rec = stat.get(u)!;
    rec.n += 1;
    rec.c += r.is_correct === 1 ? 1 : 0;
  }

  // 🔹 計算各單元正確率（百分比、四捨五入至小數第2位）
  const labels = Array.from(stat.keys());
  const accs = labels.map((u) => {
    const rec = stat.get(u)!;
    const rate = rec.n ? (rec.c / rec.n) * 100 : 0;
    return parseFloat(rate.toFixed(2)); // ✅ 轉成百分比並保留兩位小數
  });

  // 🔹 依正確率排序（高→低）
  const idx = accs
    .map((v, i) => [v, i] as const)
    .sort((a, b) => b[0] - a[0])
    .map((x) => x[1]);

  const labelsSorted = idx.map((i) => labels[i]);
  const dataSorted = idx.map((i) => accs[i]);


  return {
    data: {
      labels: labelsSorted,
      datasets: [
        {
          label: "正確率（%）",
          data: dataSorted,
        },
      ],
    },
    options: {
      responsive: true,
      indexAxis: "y" as const,
      maintainAspectRatio: false as const,
      scales: {
        x: {
          suggestedMin: 0,
          suggestedMax: 100, // ✅ 改為百分比刻度
          ticks: { stepSize: 20, callback: (val: any) => `${val}%` },
        },
      },
    },
  };
}, [currentRows]);


  // 圖表資料：答對/答錯分布（圓環圖）
  const chartCorrectPie = useMemo(() => {
    const n = currentRows.length;
    const c = currentRows.reduce((acc, r) => acc + (r.is_correct === 1 ? 1 : 0), 0);
    const w = n - c;
    return {
      data: {
        labels: ["答對", "答錯"],
        datasets: [{ data: [c, w] }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false as const,
      },
    };
  }, [currentRows]);

  // 圖表資料：闖關時間分佈（秒，直方圖）
  const chartTimeHist = useMemo(() => {
    const secs = currentRows
      .map((r) => (r.game_time_ms ?? 0) / 1000)
      .filter((v) => Number.isFinite(v)) as number[];

    if (secs.length === 0) {
      return {
        data: { labels: [], datasets: [{ label: "次數", data: [] }] },
        options: { responsive: true, maintainAspectRatio: false as const },
      };
    }

    const binN = 10;
    const min = Math.min(...secs);
    const max = Math.max(...secs);
    const binSize = (max - min) / binN || 1;
    const bins = new Array(binN).fill(0);
    for (const v of secs) {
      let idx = Math.floor((v - min) / binSize);
      if (idx >= binN) idx = binN - 1;
      if (idx < 0) idx = 0;
      bins[idx]++;
    }
    const labels = bins.map(
      (_, i) => `${(min + i * binSize).toFixed(1)}~${(min + (i + 1) * binSize).toFixed(1)}`
    );

    return {
      data: { labels, datasets: [{ label: "次數", data: bins }] },
      options: {
        responsive: true,
        maintainAspectRatio: false as const,
      },
    };
  }, [currentRows]);

  // 表格欄位
  const tableRows = useMemo(() => {
    return [...currentRows].reverse(); // 最新在上
  }, [currentRows]);

  
  // 儀表板設計
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-10xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Calculator className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">數學測驗分析</h1>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 作答次數 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">作答次數</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">
                  <div className="text-4xl font-bold">{kpi.n || 0}</div>
                  <div className="text-xs text-muted-foreground">單元數：{kpi.unitCount}</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 整體答對率 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">整體答對率</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">
                  <div className="text-4xl font-bold">{fmtPct(kpi.acc)}</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 平均闖關時間 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">平均闖關時間</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">
                  <div className="text-4xl font-bold">{fmtSecs(kpi.avgTime)}</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 數學成績 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">數學成績</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">
                  <div className="text-4xl font-bold">{kpi.profile?.math_score ?? "-"}</div>
                </div>
              </div>
            </CardHeader>
          </Card>
      </div>

      {/* 控制列 */}
        <CardHeader className="pb-0">
        </CardHeader>
        <CardContent className="grid grid-cols-0 md:grid-cols-5 gap-4">
          {/* 學生選擇（若 context 沒提供 user_sn 才顯示） */}
          {!Number(studentInfo?.name ?? 0) && (
            <div className="space-y-0">
              <label className="text-xs text-muted-foreground">學生（user_sn）</label>
              <Select value={sidSelect} onValueChange={setSidSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇學生" />
                </SelectTrigger>
              </Select>
            </div>
          )}

          {/* 日期區間 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">起始日期（含）</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">結束日期（含）</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* 單元關鍵字 */}
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs text-muted-foreground">搜尋單元</label>
            <Input
              placeholder="輸入單元關鍵字"
              value={unitKW}
              onChange={(e) => setUnitKW(e.target.value)}
            />
          </div>
        </CardContent>
      

      {/* 圖表 1：正確率趨勢、圖表 2：單元正確率 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <CardTitle className="text-sm">正確率趨勢（依時間）</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[360px]">
            <Line data={chartAccuracyOverTime.data} options={chartAccuracyOverTime.options} />
          </CardContent>
        </Card>



        <Card className="bg-card/80 backdrop-blur-sm bborder-border/100 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">單元正確率</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <Bar data={chartUnitAccuracy.data} options={chartUnitAccuracy.options} />
          </CardContent>
        </Card>
      </div>

      {/* 圖表 3：作答結果分佈、圖表 4：闖關時間分佈 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">作答結果分佈</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <Doughnut data={chartCorrectPie.data} options={chartCorrectPie.options} />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">闖關時間分佈（秒）</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <Bar data={chartTimeHist.data} options={chartTimeHist.options} />
          </CardContent>
        </Card>
      </div>

      {/* 明細表 */}
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">詳細作答紀錄</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>單元名稱</TableHead>
                <TableHead>單元流水號</TableHead>
                <TableHead>回答問題的流水號</TableHead>
                <TableHead>答題狀況</TableHead>
                <TableHead>遊戲闖關時間(秒)</TableHead>
               
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.unit_name || "-"}</TableCell>
                  <TableCell>{r.unit_id || "-"}</TableCell>
                  <TableCell>{r.answer_problem_num || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.is_correct === 1 ? "text-green-300" : "text-red-300"}>
                      {r.is_correct === 1 ? "✔" : "✘"}
                    </Badge>
                  </TableCell>
                  <TableCell>{((r.game_time_ms ?? 0) / 1000).toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
