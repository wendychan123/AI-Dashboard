import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, BarChart3, Film, TrendingUp, Brain, Calendar } from "lucide-react";
import Papa from "papaparse";
import dayjs from "dayjs";
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
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Input } from "@/components/ui/input";
import { useStudent } from "@/contexts/StudentContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartJsTooltip,
  Legend
);

const CSV_VIDEO =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR7_iDTN7BXSyxNoRKXkHlUjd_N5pp1yagMk7aZxxk_AHNW6zACdCFHgW5E0Qhmb7PD9qgKufveqHKe/pub?gid=721318667&single=true&output=csv";

interface VideoRowCSV {
  user_sn: string;
  subject_name: string;
  video_name: string;
  video_len: string;
  finish_rate: string;
  start_time: string;
  end_time: string;
}

interface VideoRow {
  user_sn: number;
  subject_name: string;
  video_name: string;
  video_len: number;
  finish_rate: number;
  start_time: string;
  end_time: string;
}

export default function StudentVideo() {
  const { studentInfo } = useStudent();
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");

  const toNum = (v: any): number | null => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : null;
  };

  // 載入 CSV
  useEffect(() => {
    Papa.parse<VideoRowCSV>(CSV_VIDEO, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const normalized = (res.data as any[]).map((r) => ({
          user_sn: toNum(r.user_sn) ?? 0,
          subject_name: (r.subject_name || "未知").trim(),
          video_name: (r.video_name || "(未命名影片)").trim(),
          video_len: toNum(r.video_len) ?? 0,
          finish_rate: toNum(r.finish_rate) ?? 0,
          start_time: (r.start_time || "").trim(),
          end_time: (r.end_time || "").trim(),
        }));
        setRows(normalized);
      },
    });
  }, []);

  // 篩選當前學生
  const sid = Number(studentInfo?.name ?? 0);
  const currentRows = useMemo(
    () => rows.filter((r) => r.user_sn === sid),
    [rows, sid]
  );

  // 自動偵測全日期範圍
  const allDates = useMemo(() => {
    const set = new Set<string>();
    currentRows.forEach((r) => {
      const d = (r.start_time || "").split(" ")[0];
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [currentRows]);

  // 初始化日期選取
  useEffect(() => {
    if (allDates.length > 0) {
      setDateStart(allDates[0]);
      setDateEnd(allDates[allDates.length - 1]);
    }
  }, [allDates]);

  // 篩選日期區間
  const filteredRows = useMemo(() => {
    if (!dateStart || !dateEnd) return currentRows;
    const start = dayjs(dateStart);
    const end = dayjs(dateEnd);
    return currentRows.filter((r) => {
      const dStr = (r.start_time || "").split(" ")[0];
      const d = dayjs(dStr);
      return d.isValid() && d.isAfter(start.subtract(1, "day")) && d.isBefore(end.add(1, "day"));
    });
  }, [currentRows, dateStart, dateEnd]);

  // KPI 統計
  const kpis = useMemo(() => {
    const totalSessions = filteredRows.length;
    const distinctVideos = new Set(filteredRows.map((r) => r.video_name)).size;
    const avgFinish =
      totalSessions > 0
        ? filteredRows.reduce((sum, r) => sum + r.finish_rate, 0) / totalSessions
        : 0;

    const bySub: Record<string, number[]> = {};
    filteredRows.forEach((r) => {
      if (!bySub[r.subject_name]) bySub[r.subject_name] = [];
      bySub[r.subject_name].push(r.finish_rate);
    });
    let bestSubject = "-";
    if (Object.keys(bySub).length > 0) {
      const sorted = Object.entries(bySub)
        .map(([k, arr]) => [k, arr.reduce((a, b) => a + b, 0) / arr.length] as [string, number])
        .sort((a, b) => b[1] - a[1]);
      bestSubject = sorted[0][0];
    }

    return { totalSessions, distinctVideos, avgFinish, bestSubject };
  }, [filteredRows]);

  // ==================== 圖表設定 ====================
  const chartDaily = useMemo(() => {
    const countByDate: Record<string, number> = {};
    filteredRows.forEach((r) => {
      const date = (r.start_time || "").split(" ")[0];
      if (!date) return;
      countByDate[date] = (countByDate[date] || 0) + 1;
    });
    const labels = Object.keys(countByDate).sort();
    const data = labels.map((d) => countByDate[d]);
    return {
      labels,
      datasets: [
        {
          label: "瀏覽次數",
          data,
          borderColor: "#64b5f6",
          backgroundColor: "rgba(100,181,246,0.25)",
          tension: 0.3,
        },
      ],
    };
  }, [filteredRows]);

  const chartFinish = useMemo(() => {
    const bins = { "0–25%": 0, "25–50%": 0, "50–75%": 0, "75–100%": 0 };
    filteredRows.forEach((r) => {
      const f = r.finish_rate;
      if (f < 25) bins["0–25%"]++;
      else if (f < 50) bins["25–50%"]++;
      else if (f < 75) bins["50–75%"]++;
      else bins["75–100%"]++;
    });
    return {
      labels: Object.keys(bins),
      datasets: [
        {
          data: Object.values(bins),
          backgroundColor: ["#64b5f6", "#ef9a9a", "#ffcc80", "#81c784"],
        },
      ],
    };
  }, [filteredRows]);

  const chartSubject = useMemo(() => {
    const secBySub: Record<string, number> = {};
    filteredRows.forEach((r) => {
      const sec = r.video_len * (r.finish_rate / 100);
      secBySub[r.subject_name] = (secBySub[r.subject_name] || 0) + sec;
    });
    const sorted = Object.entries(secBySub).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([k]) => k);
    const data = sorted.map(([_, v]) => Math.round(v));
    return {
      labels,
      datasets: [
        {
          label: "觀看秒數",
          data,
          backgroundColor: "rgba(100,181,246,0.5)",
        },
      ],
    };
  }, [filteredRows]);

  const chartTopVideo = useMemo(() => {
    const byVideo: Record<string, number> = {};
    filteredRows.forEach((r) => {
      const sec = r.video_len * (r.finish_rate / 100);
      byVideo[r.video_name] = (byVideo[r.video_name] || 0) + sec;
    });
    const top = Object.entries(byVideo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const labels = top.map(([k]) => k);
    const data = top.map(([_, v]) => Math.round(v));
    return {
      labels,
      datasets: [
        {
          label: "觀看秒數",
          data,
          backgroundColor: "rgba(100,181,246,0.6)",
        },
      ],
    };
  }, [filteredRows]);

  // 完成率最高 / 最低影片
const finishStats = useMemo(() => {
  if (filteredRows.length === 0) {
    return {
      topVideoName: "-",
      topVideoRate: 0,
      lowVideoName: "-",
      lowVideoRate: 0,
    };
  }
  const sorted = [...filteredRows].sort((a, b) => b.finish_rate - a.finish_rate);
  return {
    topVideoName: sorted[0].video_name,
    topVideoRate: sorted[0].finish_rate,
    lowVideoName: sorted[sorted.length - 1].video_name,
    lowVideoRate: sorted[sorted.length - 1].finish_rate,
  };
}, [filteredRows]);

  // -----------------------------
  // 儀表板設計

  return (
    <div className="max-w-10xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Youtube className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    影片瀏覽分析
                  </h1>
                </div>
              </div>
            </div>
          </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 瀏覽影片數 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">瀏覽影片數</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">{kpis.distinctVideos}</div>
              </div>
            </CardHeader>
          </Card>

          {/* 瀏覽次數 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">瀏覽次數</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">{kpis.totalSessions}</div>
              </div>
            </CardHeader>
          </Card>

          {/* 平均完成率 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">平均完成率</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">{kpis.avgFinish.toFixed(1)}%</div>
              </div>
            </CardHeader>
          </Card>

          {/* 最專注科目 */}
          <Card className="group bg-card/80 backdrop-blur-sm border border-border/100 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">最專注科目</CardTitle>
                <div className="text-3xl font-bold text-foreground mb-0">{kpis.bestSubject}</div>
              </div>
            </CardHeader>
          </Card>
        
      </div>

      {/* 日期控制列 */}
      {allDates.length > 0 && (
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mt-4 p-3 bg-muted/10 rounded-lg ">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">起始日期：</span>
            <Input
              type="date"
              value={dateStart}
              min={allDates[0]}
              max={dateEnd}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground ml-3">結束日期：</span>
            <Input
              type="date"
              value={dateEnd}
              min={dateStart}
              max={allDates[allDates.length - 1]}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
            篩選區間：{dateStart} ～ {dateEnd}
            <span className="ml-2 text-muted-foreground/80">（共 {filteredRows.length} 筆資料）</span>
          </div>
        </div>
      )}


      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>每日瀏覽次數</CardTitle></CardHeader><CardContent><Line key={`daily-${dateStart}-${dateEnd}`} data={chartDaily} /></CardContent></Card>
        {/* 完成率分析 */}
        <Card>
          <CardHeader>
            <CardTitle>完成率分析</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* 左側：Doughnut 圖 */}
            <div className="w-full md:w-1/2">
              <Doughnut
                key={`finish-${dateStart}-${dateEnd}`}
                data={chartFinish}
                options={{
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "#cfe3ff", boxWidth: 12, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>

            {/* 右側：數據卡 */}
            <div className="flex flex-col gap-3 w-full md:w-1/2">
              <div className="bg-muted/10 rounded-lg border border-border/30 p-3">
                <p className="text-sm text-muted-foreground">平均完成率</p>
                <p className="text-2xl font-semibold text-primary mt-1">
                  {kpis.avgFinish.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/10 rounded-lg border border-border/30 p-3">
                <p className="text-sm text-muted-foreground">最高完成率影片</p>
                <p className="text-base font-medium mt-1">{finishStats.topVideoName}</p>
                <p className="text-xl font-semibold text-success mt-1">
                  {finishStats.topVideoRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/10 rounded-lg border border-border/30 p-3">
                <p className="text-sm text-muted-foreground">最低完成率影片</p>
                <p className="text-base font-medium mt-1">{finishStats.lowVideoName}</p>
                <p className="text-xl font-semibold text-destructive mt-1">
                  {finishStats.lowVideoRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>各科目觀看秒數</CardTitle></CardHeader><CardContent><Bar key={`subject-${dateStart}-${dateEnd}`} data={chartSubject} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Top 5 影片觀看秒數</CardTitle></CardHeader><CardContent><Bar key={`top-${dateStart}-${dateEnd}`} data={chartTopVideo} options={{ indexAxis: "y" }} /></CardContent></Card>
      </div>
    </div>
  );
}
