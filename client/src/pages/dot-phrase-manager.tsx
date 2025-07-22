import { DotPhraseManager } from '@/components/DotPhraseManager';
import { MainLayout } from '@/components/MainLayout';
import React from 'react';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

export default function DotPhraseManagerPage({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  return (
    <MainLayout
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
      selectedSubOption={selectedSubOption}
      setSelectedSubOption={setSelectedSubOption}
      livePreview={null}
    >
      <div className="min-h-screen flex flex-col bg-[var(--arinote-beige)]">
        <DotPhraseManager />
      </div>
    </MainLayout>
  );
}