import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, Target, Clock, Star, TrendingUp, BookOpen, Zap } from "lucide-react";

const AISuggestions = () => {
  const suggestions: any[] = [];

  const getIconColor = (color: string) => {
    switch (color) {
      case "primary": return "text-primary";
      case "success": return "text-success";
      case "warning": return "text-warning";
      default: return "text-primary";
    }
  };

  const getBadgeVariant = (priority: string) => {
    switch (priority) {
      case "高": return "destructive";
      case "中": return "secondary";
      case "低": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-card rounded-2xl p-8 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-success rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-success-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI 學習建議</h1>
              <p className="text-muted-foreground mt-2">基於您的學習數據，AI 為您量身打造個人化建議</p>
            </div>
          </div>
        </div>

        {/* AI Analysis Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">學習效率分析</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">--</div>
              <p className="text-xs text-muted-foreground mt-2">
                等待分析數據
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">學習風格匹配</CardTitle>
              <Star className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">--%</div>
              <p className="text-xs text-muted-foreground mt-2">
                等待學習風格分析
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">建議採用率</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">--%</div>
              <p className="text-xs text-muted-foreground mt-2">
                等待建議採用統計
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">個人化學習建議</h2>
            <Button variant="outline" className="gap-2">
              <Brain className="w-4 h-4" />
              重新分析
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">等待 AI 分析</h3>
                <p className="text-muted-foreground">
                  當有學習數據時，AI 將為您生成個人化建議
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Learning Insights */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              深度學習洞察
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">學習模式分析</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    等待學習時間分析
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    等待注意力分析
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    等待學習方式分析
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">改進建議統計</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    等待建議統計：-- 項
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    等待進度統計：-- 項
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    等待執行統計：-- 項
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AISuggestions;