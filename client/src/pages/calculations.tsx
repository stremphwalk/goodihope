import { CalculationsPage } from '../components/CalculationsPage';
import { MainLayout } from '@/components/MainLayout';
import React from 'react';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

export default function Calculations({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  return (
    <MainLayout
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
      selectedSubOption={selectedSubOption}
      setSelectedSubOption={setSelectedSubOption}
      livePreview={null}
    >
      <div className="min-h-screen flex flex-col bg-[var(--arinote-beige)]">
        <div className="flex flex-1 flex-col md:flex-row gap-4 p-2 md:p-6">
          <CalculationsPage />
        </div>
      </div>
    </MainLayout>
  );
}