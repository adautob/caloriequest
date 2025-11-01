'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import { addDays, format, isToday } from "date-fns";
import { ptBR } from 'date-fns/locale';

export default function DateNavigator() {
  const { selectedDate, setSelectedDate } = useDashboard();

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const handlePreviousDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  }

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  }

  const getDisplayDate = () => {
    if (isToday(selectedDate)) {
      return "Hoje";
    }
    return format(selectedDate, "PPP", { locale: ptBR });
  }

  return (
    <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePreviousDay} aria-label="Dia anterior">
            <ChevronLeft className="h-4 w-4" />
        </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayDate()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
       <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Próximo dia" disabled={isToday(selectedDate)}>
            <ChevronRight className="h-4 w-4" />
        </Button>
    </div>
  );
}
