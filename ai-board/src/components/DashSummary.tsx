// src/components/DashSummary.tsx
import { Card, CardHeader, CardTitle } from "@/components/ui/card";



// 總測驗數
export function TotalMissionsCard({ totalMissions }: { totalMissions: number }) {
  return (
    <Card className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground mb-2">
          總測驗數
        </CardTitle>
        <div className="text-4xl font-bold text-primary mb-2">？</div>
      </CardHeader>
    </Card>
  );
}



// 整體正確率
export function AccRateCard({ accRate }: { accRate: number }) {
  return (
    <Card className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground mb-2">
          整體正確率
        </CardTitle>
        <div className="text-4xl font-bold text-primary mb-2">？</div>
      </CardHeader>
    </Card>
  );
}

// 答對率 100% 試卷
export function PerfectMissionsCard({ perfectMissions }: { perfectMissions: string[] }) {
  return (
    <Card className="bg-background rounded-lg p-6 text-center border border-border hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground mb-2">
          答對率 100% 試卷
        </CardTitle>
        {/* 顯示答對率100%的 mission_id */}
                
                <p className="mt-2 text-sm text-muted-foreground">尚無答對率 100% 的測驗卷</p>
              
      </CardHeader>
    </Card>
  );
}
