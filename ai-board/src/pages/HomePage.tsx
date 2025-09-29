import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, BookOpen, Maximize, Minimize } from "lucide-react";
import { useState } from "react";
import educationBg from "@/assets/education-bg.jpg";

const HomePage = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const roles = [
    {
      id: "manager",
      title: "管理者",
      description: "總覽校務數據\n輔助決策與資源分配",
      icon: <Users className="w-12 h-12 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      onClick: () => alert("管理者功能開發中"),
    },
    {
      id: "teacher",
      title: "教師",
      description: "平台學習狀況\n提供教學調整建議",
      icon: <BookOpen className="w-12 h-12 text-white" />,
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
      onClick: () => alert("教師功能開發中"),
    },
    {
      id: "student",
      title: "學生",
      description: "個人學習進度\n獲取個人化建議",
      icon: <GraduationCap className="w-12 h-12 text-white" />,
      color: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      onClick: () => navigate("/student-login"),
    },
  ];

  // 切換全螢幕
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("無法進入全螢幕:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${educationBg})` }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-sm">
                  <div className="w-5 h-5 bg-white rounded-sm"></div>
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  多層級教育智慧儀表板
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* 全螢幕按鈕 */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>

                {/* 問號按鈕 */}
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4 text-left">
                多層級身份
              </h2>
              <div className="w-24 h-1 bg-primary"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white/95 backdrop-blur-sm"
                  onClick={role.onClick}
                >
                  <div
                    className={`${role.color} p-8 text-center relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <div className="mb-4 flex justify-center">{role.icon}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {role.title}
                      </h3>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 bg-white/10 rounded-full"></div>
                  </div>

                  <CardContent className="p-6 bg-white/95">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                          {role.description}
                        </p>
                      </div>
                      <div className="ml-4 text-muted-foreground group-hover:text-primary transition-colors">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
