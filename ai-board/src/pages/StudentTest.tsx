import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudent } from "@/contexts/StudentContext";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend,
} from "chart.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpenCheck, ArrowLeft, PenTool, BarChart3, TrendingUp, Target, Brain, Lightbulb, Zap, Clock, Award } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


// 註冊 Chart.js 元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartJsTooltip,
  Legend
);

// 🟢 測驗 CSV URL
const CSV_TEST =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2T-FvT_sR4ycbOTGpOF5colwjyUMkoudJIDBXBMn7HErI5QpNjFbAjQEWUGTCbddmz0lRgEBZHYDh/pub?gid=495356082&single=true&output=csv";

// 🟢 CSV 定義
export interface TestRowCSV {
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
  result_success: string;  // 答對 / 答錯
  mission_id: string;
  question_id: string;
}

export default function StudentTest() {
  const { studentInfo } = useStudent();
  const [testRows, setTestRows] = useState<TestRow[]>([]);
  const [subjectMode, setSubjectMode] = useState("count"); // count | acc
  const [timeMode, setTimeMode] = useState("count");       // count | acc

  // 數字轉換
  const toNum = (v: any): number | null => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : null;
  };

  // 正規化資料
const normalizeTest = (r: TestRowCSV): TestRow => {
  let parsedDate: Date | null = null;

  if (r.action_time) {
    // 1. 清理格式：空格改 T、移除 +08:00
    let clean = r.action_time.replace(" ", "T").replace(/\+\d{2}:\d{2}$/, "");
    const d = new Date(clean);

    // 2. 檢查是否為合法日期
    if (!isNaN(d.getTime())) {
      parsedDate = d;
    } else {
      console.warn("無法解析日期:", r.action_time);
      parsedDate = null; // fallback
    }
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


  // 載入 CSV
  useEffect(() => {
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
        setTestRows(clean.map(normalizeTest));
      },
    });
  }, []);

  // 過濾登入學生資料
  const sid = Number(studentInfo?.name ?? 0);
  const currentTests = useMemo(
    () => testRows.filter((r) => r.user_sn === sid),
    [testRows, sid]
  );

  // -----------------------------
  // 計算統計
  // 1. 總測驗數 (mission_id 不重複)
  const totalMissions = new Set(currentTests.map((r) => r.mission_id)).size;

  // 2. 測驗時間 (mission_id 分組)
  const missionTimes: Record<string, number> = {};
  const missionCounts: Record<string, number> = {};
  currentTests.forEach((r) => {
    const parts = r.result_duration.match(/(\d+)分\s*(\d+)秒/);
    let sec = 0;
    if (parts) {
      const min = parseInt(parts[1]) || 0;
      const s = parseInt(parts[2]) || 0;
      sec = min * 60 + s;
    }
    missionTimes[r.mission_id] = (missionTimes[r.mission_id] || 0) + sec;
    missionCounts[r.mission_id] = (missionCounts[r.mission_id] || 0) + 1;
  });

  const missionLabels = Object.keys(missionTimes);

  // 測驗總耗時
  const missionDurationData = missionLabels.map((m) => missionTimes[m]);
  const missionChart = {
    labels: missionLabels,
    datasets: [{ label: "測驗總耗時 (秒)", data: missionDurationData, backgroundColor: "#60a5fa" }],
  };

  // 平均作答時間 (mission_id 分組)
  const missionAvgData = missionLabels.map((m) => Math.round(missionTimes[m] / missionCounts[m]));
  const missionAvgChart = {
    labels: missionLabels,
    datasets: [{ label: "平均作答時間 (秒)", data: missionAvgData, backgroundColor: "#34d399" }],
  };

  // 計算答對率 100% 的 mission_id
    const perfectMissions = missionLabels.filter((m) => {
    const rows = currentTests.filter((r) => r.mission_id === m);
    return rows.length > 0 && rows.every((r) => r.result_success === "答對");
    });

  // 3. 整體答對率
  const totalTests = currentTests.length;
  const totalCorrect = currentTests.filter((r) => r.result_success === "答對").length;
  const accRate = totalTests > 0 ? Math.round((totalCorrect / totalTests) * 100) : 0;

  // 4. 詳細作答紀錄
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  

  // mission_id 選項
  const missionOptions = [...new Set(currentTests.map((r) => r.mission_id))];

  // 🟢 自動選第一個 mission
  useEffect(() => {
    if (!selectedMission && missionOptions.length > 0) {
      setSelectedMission(missionOptions[0]);
    }
  }, [missionOptions, selectedMission]);

  // 過濾選中的 mission
  const filteredMissionRows = selectedMission
    ? currentTests.filter((r) => r.mission_id === selectedMission)
    : [];

  const missionDate: string =
    filteredMissionRows.length > 0
      ? filteredMissionRows[0].action_time
        ? filteredMissionRows[0].action_time.toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : String(filteredMissionRows[0].action_time ?? "")
      : "";

  const missionSubject = filteredMissionRows.length > 0 ? filteredMissionRows[0].object_type : "";

    // 分頁狀態
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    const pagedRows = filteredMissionRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredMissionRows.length / rowsPerPage);



  // -----------------------------
  // 儀表板設計
  return (
    <div className="bg-gradient-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-background border-b border-border/20 mb-4 -mx-4 -mt-8 px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpenCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    測驗表現分析
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 1. 總測驗數 */}
          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">總測驗數</CardTitle>
                <div className="text-4xl font-bold text-foreground mb-0">{totalMissions} 份</div>
              </div>
            </CardHeader>
            
          </Card>

          {/* 2. 整體答對率 */}
          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader className="pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">整體正確率</CardTitle>
                <div className="text-4xl font-bold text-foreground mb-0">
                 {accRate}%
              </div>
              </div>
            </CardHeader>
            
          </Card>

          


          
        </div>
        {/* 🔹 第一行四張統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-6 mb-18">
          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
         
          <CardHeader>
            <CardTitle>答對率 100% 試卷</CardTitle>
            <div className="flex items-center justify-between mb-8 gap-6">
                {/* 顯示答對率100%的 mission_id */}
                {perfectMissions.length > 0 ? (
                <p className="mt-2 text-sm text-green-600">
                   {perfectMissions.join(", ")}
                </p>
                ) : (
                <p className="mt-2 text-sm text-muted-foreground">尚無答對率 100% 的測驗</p>
                )}
            </div>
            </CardHeader>
            </Card>  
        
         
          {/* 2. 測驗總耗時 */}
          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader><CardTitle>測驗總耗時</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar
                  data={missionChart}
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

          
          {/* 4. 平均作答時間 */}
          <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-smooth hover:-translate-y-1">
            <CardHeader><CardTitle>平均作答時間</CardTitle></CardHeader>
            
            <CardContent>
              <div className="h-[300px]">
                <Bar
                  data={missionAvgChart} 
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

          {/* 5. 詳細作答紀錄 */}
        
        <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-card mt-12">
          <CardHeader className="flex justify-start items-start">
            <CardTitle>詳細作答紀錄</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between mb-4 gap-6">
              {/* 下拉式選單 */}
              <Select
                value={selectedMission || ""}
                onValueChange={(v) => {
                  setSelectedMission(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[230px]">
                  <SelectValue placeholder="選擇測驗 (mission_id)" />
                </SelectTrigger>
                <SelectContent>
                  {missionOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 測驗資訊 */}
              {selectedMission && (
                <p className="text-sm text-muted-foreground flex-1">
                  測驗日期：
                  <span className="font-medium text-blue-600">{missionDate}</span> ｜ 學科類型：
                  <span className="font-medium text-blue-600">{missionSubject}</span> ｜ 答對率：
                  {(() => {
                    const acc =
                      filteredMissionRows.length > 0
                        ? Math.round(
                            (filteredMissionRows.filter((r) => r.result_success === "答對").length /
                              filteredMissionRows.length) *
                              100
                          )
                        : 0;
                    return (
                      <span
                        className={`font-bold ${acc >= 60 ? "text-blue-600" : "text-red-600"}`}
                      >
                        {acc}%
                      </span>
                    );
                  })()}
                </p>
              )}
            </div>

            {/* 表格 */}
            {selectedMission && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>題目編號</TableHead>
                      <TableHead>花費時間</TableHead>
                      <TableHead>結果</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.question_id}</TableCell>
                        <TableCell>{row.result_duration}</TableCell>
                        <TableCell>
                          {row.result_success === "答對" ? (
                            <span className="text-green-600 font-medium">答對</span>
                          ) : (
                            <span className="text-red-600 font-medium">答錯</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 分頁控制 */}
                <div className="flex justify-end items-center gap-4 mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    上一頁
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages || 1}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    下一頁
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
