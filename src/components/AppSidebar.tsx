import { Brain, Home, LogOut, FileText, ChevronDown, ChevronRight, LibraryBig, Power } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useStudent } from "@/contexts/StudentContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar() {
  const { state } = useSidebar();
  const { studentInfo } = useStudent();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  // 控制首頁總覽的展開狀態
  const [open, setOpen] = useState(true);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="bg-sidebar-background border-r-0">
      {/* Menu */}
      <SidebarContent className={`${isCollapsed ? "px-0" : "px-2"} py-1`}>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="space-y-1">
              {/* 首頁 */}
              <NavLink
                to="/student-dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all duration-200 group
                  ${isCollapsed ? "justify-start px-1 py-4" : "gap-4 px-4 py-4"}
                  ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`
                }
              >
                <Home className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">首頁</span>}
              </NavLink>

              {/* 學習區域 (純收合控制，不跳轉) */}
              <button
                onClick={() => setOpen(!open)}
                className={`flex items-center w-full rounded-lg transition-all duration-200
                  ${isCollapsed ? "justify-start px-1 py-3" : "gap-4 px-4 py-4"}
                  text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                `}
              >
                <LibraryBig className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium mr-auto">學習區域</span>}
                {!isCollapsed && (
                  open ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                )}
              </button>


              {/* 子選單 */}
              {!isCollapsed && open && (
                <div className="space-y-1">
                  {[
                    { title: "練習表現區", url: "/student-dashboard/practice" },
                    { title: "測驗答題區", url: "/student-dashboard/test" },
                    { title: "影片瀏覽區", url: "/student-dashboard/video" },
                    { title: "英文單字區", url: "/student-dashboard/words" },
                    { title: "數學測驗區", url: "/student-dashboard/math" },
                  ].map((sub) => (
                    <NavLink
                      key={sub.title}
                      to={sub.url}
                      className={({ isActive }) =>
                        `flex items-center rounded-lg transition-all duration-200
                        ${isCollapsed ? "justify-start px-1 py-3" : "px-14 py-3"}
                        ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      {sub.title}
                    </NavLink>
                  ))}
                </div>
              )}


              {/* 其他主選單 */}
              <NavLink
                to="/student-dashboard/atmosphere"
                end
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all duration-200 group
                  ${isCollapsed ? "justify-start px-1 py-3" : "gap-4 px-4 py-4"}
                  ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`
                }
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">學習氛圍</span>}
              </NavLink>

              <NavLink
                to="/student-dashboard/ai-suggestions"
                end
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all duration-200 group
                  ${isCollapsed ? "justify-start px-1 py-3" : "gap-4 px-4 py-4"}
                  ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`
                }
              >
                <Brain className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">AI 建議</span>}
              </NavLink>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Logout Button */}
      <div className="p-3 border-t border-sidebar-border mt-auto">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className={`w-full transition-colors
            ${
              isCollapsed
                ? "justify-start pl-1 py-3 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                : "justify-start gap-4 px-4 py-3 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
        >
          <Power className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">重新選擇層級角色</span>}
        </Button>
      </div>
    </Sidebar>
  );
}

