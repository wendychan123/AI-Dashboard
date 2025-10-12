import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StudentProvider, useStudent } from "@/contexts/StudentContext";
import {
  Home, Bot, BarChart3, FileText, LogOut, Settings, Bell, Menu as MenuIcon,
  Grip, Power, Pencil, Youtube, Calculator, X
} from "lucide-react";
import studentAvatar from "@/assets/student-avatar.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import HomePage from "./pages/HomePage";
import StudentLogin from "./pages/StudentLogin";
import Dashboard from "./pages/Dashboard";
import AISuggestions from "./pages/AISuggestions";
import Statistics from "./pages/Statistics";
import StudentPractice from "./pages/StudentPractice";
import StudentQuiz from "./pages/StudentQuiz";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const menuItems = [
  { title: "首頁", url: "/student-dashboard", icon: Home },
  { title: "練習表現", url: "/student-dashboard/practice", icon: BarChart3 },
  { title: "測驗答題", url: "/student-dashboard/quiz", icon: Pencil },
  { title: "影片瀏覽", url: "/student-dashboard/video", icon: Youtube },
  { title: "數學測驗", url: "/student-dashboard/math", icon: Calculator },
  { title: "學習建議", url: "/student-dashboard/ai-suggestions", icon: Bot },
];

const StudentDashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { studentInfo } = useStudent();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between">
          {/* Left: Logo & Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
            >
              <MenuIcon className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Grip className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">多層級教育儀表板</h1>
            </div>
          </div>

          {/* Middle: Desktop Menu */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/student-dashboard"}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                    isActive
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>

          {/* Right: User & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full">
              <Power className="w-5 h-5 text-gray-600" />
            </Button>
            {/* User Avatar */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                <AvatarImage src={studentAvatar} alt="學生頭像" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
                  {studentInfo?.name?.charAt(0) || "學"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <div className="text-sm font-semibold text-gray-900">{studentInfo?.name || "姓名"}</div>
                <div className="text-xs text-gray-500">{studentInfo?.id || "ID: 0000"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 Mobile Slide Menu */}
        {menuOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
            <div
              className="absolute top-0 left-0 w-64 bg-white h-full shadow-lg z-50 p-5 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">功能選單</h2>
                <button onClick={() => setMenuOpen(false)}>
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/practice" element={<StudentPractice />} />
          <Route path="/quiz" element={<StudentQuiz />} />
          <Route path="/ai-suggestions" element={<AISuggestions />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>
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
            <Route path="/student-dashboard/*" element={<StudentDashboardLayout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StudentProvider>
  </QueryClientProvider>
);

export default App;
