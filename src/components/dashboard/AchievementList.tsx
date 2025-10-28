import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { achievements } from '@/lib/data';
import { cn } from "@/lib/utils";

export default function AchievementList() {
  return (
    <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="font-headline">Conquistas</CardTitle>
        <CardDescription>Suas medalhas e marcos.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {achievements.map((achievement) => (
              <Tooltip key={achievement.id}>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center justify-center p-3 rounded-full aspect-square transition-all duration-300 transform hover:scale-110",
                    achievement.unlocked ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground opacity-50'
                  )}>
                    <achievement.icon className="h-6 w-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{achievement.name}</p>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
