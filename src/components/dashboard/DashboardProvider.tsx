'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import DailyCheck from './DailyCheck';

interface DashboardContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <DashboardContext.Provider value={{ selectedDate, setSelectedDate }}>
      <DailyCheck />
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
