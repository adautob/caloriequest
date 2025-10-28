import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { dailyMeals } from '@/lib/data';
import AddMealDialog from "./AddMealDialog";

export default function MealList() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle className="font-headline">Refeições do Dia</CardTitle>
          <CardDescription>
            {dailyMeals.length} refeições registradas hoje.
          </CardDescription>
        </div>
        <AddMealDialog>
          <Button size="sm" className="ml-auto gap-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-4 w-4" />
            Adicionar
          </Button>
        </AddMealDialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dailyMeals.map((meal) => (
            <div key={meal.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
              <div>
                <p className="font-semibold">{meal.name}</p>
                <p className="text-sm text-muted-foreground">{meal.time}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold">{meal.calories} kcal</p>
                <p className="text-sm text-muted-foreground">
                  P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
