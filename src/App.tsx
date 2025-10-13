import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StudentProvider, useStudent } from "@/contexts/StudentContext";
import {
  Home,
  Bot,
  BarChart3,
  FileText,
  LogOut,
  Settings,
  Bell,
  Menu as MenuIcon,
  Grip,
  Power,
  Pencil,
  Youtube,
  Calculator,
  X,
} from "lucide-react";
import studentAvatar from "@/assets/student-avatar.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

import HomePage from "./pages/HomePage";
import StudentLogin from "./pages/StudentLogin";
import Dashboard from "./pages/Dashboard";
import LearningAtmosphere from "./pages/LearningAtmosphere";
import AISuggestions from "./pages/AISuggestions";
import Statistics from "./pages/Statistics";
import StudentPractice from "./pages/StudentPractice";
import NotFound from "./pages/NotFound";
import StudentQuiz from "./pages/StudentQuiz";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Mobile Menu + Logo & Navigation */}
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <MenuIcon className="w-5 h-5 text-gray-700" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-white">
                  <SheetHeader className="mb-4">
                  </SheetHeader>
                  
                  <nav className="flex flex-col gap-1">
                    {menuItems.map((item) => (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end={item.url === "/student-dashboard"}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-3 ${
                            isActive
                              ? "text-indigo-600 bg-indigo-50"
                              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                          }`
                        }
                      >
                        <item.icon className="w-5 h-5" />
                        {item.title}
                      </NavLink>
                    ))}
                  </nav>

                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={studentAvatar} alt="學生頭像" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
                          {studentInfo?.name?.charAt(0) || "學"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{studentInfo?.name || "姓名"}</div>
                        <div className="text-xs text-gray-500">{studentInfo?.id || "ID: 0000"}</div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleNavClick();
                        navigate("/student-login");
                      }}
                      className="w-full mt-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>登出</span>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <div className="flex items-center gap-1">
                <div className="w-8 h-8 bg-gradient-to-br  rounded-lg flex items-center justify-center">
                  <Grip className="w-4 h-4 text-gray" />
                </div>
                <h1 className="text-xl font-bold text-gray-900"></h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-0 ml-0">
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
            </div>

            {/* Right: User Info & Actions - Desktop Only */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full">
                <Power className="w-5 h-5 flex-shrink-0" />
              </Button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/student-login")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">登出</span>
              </Button>
            </div>

            {/* Right: Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                <AvatarImage src={studentAvatar} alt="學生頭像" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                  {studentInfo?.name?.charAt(0) || "學"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quiz" element={<StudentQuiz />} />
          <Route path="/ai-suggestions" element={<AISuggestions />} />
          <Route path="/practice" element={<StudentPractice />} />
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
            {/* Homepage without sidebar */}
            <Route path="/" element={<HomePage />} />

            {/* Student login page */}
            <Route path="/student-login" element={<StudentLogin />} />

            {/* Student dashboard */}
            <Route path="/student-dashboard/*" element={<StudentDashboardLayout />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StudentProvider>
  </QueryClientProvider>
);

export default App;
