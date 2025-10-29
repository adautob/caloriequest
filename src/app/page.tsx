import Header from '@/components/Header';
import CalorieSummary from '@/components/dashboard/CalorieSummary';
import MealList from '@/components/dashboard/MealList';
import WeightProgressChart from '@/components/dashboard/WeightProgressChart';
import AchievementList from '@/components/dashboard/AchievementList';
import ProtectedPage from '@/components/auth/ProtectedPage';
import MacronutrientSummary from '@/components/dashboard/MacronutrientSummary';
import DailyTip from '@/components/dashboard/DailyTip';

export default function Home() {
  return (
    <ProtectedPage>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
          <DailyTip />
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <CalorieSummary />
            <MacronutrientSummary />
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-4 rounded-xl xl:col-span-2">
              <MealList />
            </div>
            <div className="flex flex-col gap-4 rounded-xl">
               <div className="flex flex-col gap-4">
                <WeightProgressChart />
                <AchievementList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
