import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, User, Hash } from "lucide-react";
import { useStudent } from "@/contexts/StudentContext";
import Papa from "papaparse";
import educationBg from "@/assets/education-bg.jpg";

const ALL_SHEETS = [
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjuUAxurul4du6S5xU8G8EPICQXTahTlI3wdu3Ts79IKIpYN8dumxLnXdrwr_p0Mg-3q3zUI6K1AvD/pub?gid=710180589&single=true&output=csv",
  "", "", "", ""
];

const StudentLogin = () => {
  const navigate = useNavigate();
  const { setStudentInfo } = useStudent();
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const checkStudentExists = async (id: string, name: string) => {
    for (const url of ALL_SHEETS) {
      if (!url) continue;
      try {
        const data: any[] = await new Promise((resolve, reject) => {
          Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (res) => {
              const clean = (res.data as any[]).map((row) => {
                const o: any = {};
                Object.keys(row || {}).forEach((k) => {
                  const nk = (k || "").trim();
                  const v = row[k];
                  o[nk] = typeof v === "string" ? v.trim() : v;
                });
                return o;
              });
              resolve(clean);
            },
            error: (err) => reject(err),
          });
        });

        const match = data.find(
          (row) =>
            (row.user_sn || "").trim() === name.trim() &&
            (row.organization_id || "").trim() === id.trim()
        );
        if (match) return match;
      } catch (err) {
        console.error("讀取 CSV 失敗:", url, err);
      }
    }
    return null;
  };

  const handleLogin = async () => {
    if (!studentName.trim() || !studentId.trim()) return;
    setLoading(true);

    const found = await checkStudentExists(studentId, studentName);

    if (found) {
      setStudentInfo({
        name: (found.user_sn || "").trim(),
        id: (found.organization_id || "").trim(),
        organizationId: Number(found.organization_id) || 0,
        grade: Number(found.grade) || 0,
        class: Number(found.class) || 0,
        seat: Number(found.seat) || 0,
        chineseScore: Number(found.chinese_score) || 0,
        mathScore: Number(found.math_score) || 0,
        englishScore: Number(found.english_score) || 0,
      });

      navigate("/student-dashboard");
    } else {
      alert("找不到該學號或姓名，請確認輸入正確！");
    }

    setLoading(false);
  };

  const handleBack = () => navigate("/");

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col"
      style={{ backgroundImage: `url(${educationBg})` }}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-sm">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-sm"></div>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  多層級教育智慧儀表板
                </h1>
              </div>

              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 self-end sm:self-auto"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm sm:text-base">返回</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="w-full max-w-md">
            <Card className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl">
              <CardHeader className="text-center pb-4 sm:pb-6">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  學生登入
                </CardTitle>
                <p className="text-sm sm:text-base text-muted-foreground">
                  請輸入您的姓名和學號
                </p>
              </CardHeader>

              <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="studentName" className="flex items-center gap-2 text-sm sm:text-base">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>姓名</span>
                    </Label>
                    <Input
                      id="studentName"
                      type="text"
                      placeholder="請輸入您的姓名"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="flex items-center gap-2 text-sm sm:text-base">
                      <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>學號</span>
                    </Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="請輸入您的學號"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!studentName.trim() || !studentId.trim() || loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium py-2 sm:py-3 text-sm sm:text-base rounded-lg"
                  >
                    {loading ? "登入中..." : "進入學習儀表板"}
                  </Button>

                  <div className="mt-4 pt-3 border-t border-border/20 space-y-1 text-center">
                    <p className="text-[9px] sm:text-xs text-muted-foreground/70">
                      ｜測試帳號｜
                    </p>
                    <p className="text-[8px] sm:text-xs text-muted-foreground/60">
                      姓名 65038、學號 338
                    </p>
                    <p className="text-[8px] sm:text-xs text-muted-foreground/60">
                      姓名 108139、學號 1808
                    </p>
                  </div>

                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLogin;
