import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { StudentProvider, useStudent } from "@/contexts/StudentContext";
import { Home, LogOut } from "lucide-react";
import studentAvatar from "@/assets/student-avatar.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import HomePage from "./pages/HomePage";
import StudentLogin from "./pages/StudentLogin";
import Dashboard from "./pages/Dashboard";
import LearningAtmosphere from "./pages/LearningAtmosphere";
import AISuggestions from "./pages/AISuggestions";
import Statistics from "./pages/Statistics";
import StudentPractice from "./pages/StudentPractice";
import StudentTest from "./pages/StudentTest"; 
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const StudentDashboardLayout = () => {
  const location = useLocation();
  const { studentInfo } = useStudent();
  
  
  const getPageTitle = (pathname: string) => {
    const menuItems = [
      { title: "首頁總覽", url: "/student-dashboard" },
      { title: "學習氛圍", url: "/student-dashboard/atmosphere" },
      { title: "AI 學習分析", url: "/student-dashboard/ai-suggestions" },
      { title: "學習區域 / 練習表現區", url: "/student-dashboard/practice" },
      { title: "學習區域 / 測驗答題區", url: "/student-dashboard/test" },
      { title: "學習區域 / 影片瀏覽區", url: "/student-dashboard/video"},
      { title: "學習區域 / 英文單字區", url: "/student-dashboard/words" },
      { title: "學習區域 / 數學測驗區", url: "/student-dashboard/math" }
    ];

    for (const item of menuItems) {
      if (pathname === item.url) return item.title;
    }
    for (const item of menuItems) {
      if (pathname.startsWith(item.url + "/")) return item.title;
    }
    return "首頁";
  };
  
  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        {/* 🔹 固定 Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4
                           sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentTitle}</span>
            </nav>
          </div>
          
            <div className="flex items-center gap-1">
              {/* 使用者名稱或編號 */}
              <span className="text-sm text-muted-foreground">
                {studentInfo?.name ? `學生 - ${studentInfo.name} ｜` : "學生姓名"}
              </span>

              {/* 登出按鈕 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/student-login")}
                className="flex items-center gap-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">登出</span>
              </Button>
            </div>
         
        </header>

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/atmosphere" element={<LearningAtmosphere />} />
            <Route path="/ai-suggestions" element={<AISuggestions />} />
            <Route path="/practice" element={<StudentPractice />} />
            <Route path="/test" element={<StudentTest />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StudentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route
              path="/student-dashboard/*"
              element={
                <SidebarProvider>
                  <StudentDashboardLayout />
                </SidebarProvider>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StudentProvider>
  </QueryClientProvider>
);

export default App;
