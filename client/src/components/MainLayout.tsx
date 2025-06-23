import React, { useState } from "react";
import { SidebarProvider, Sidebar } from "./ui/sidebar";
import {
  FileText,
  ClipboardList,
  Calculator,
  Globe,
  ChevronDown,
  HeartPulse,
  Stethoscope,
  Pill,
  TestTube,
  AlertCircle,
  Users,
  Image,
  Brain,
  Wind,
  Sparkles
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { DotPhraseManager } from './DotPhraseManager';
import { TemplateManager } from './TemplateManager';
import { TemplateSelectorPage } from './TemplateSelectorPage';
import { SECTION_LIBRARY, getSectionById } from '@/lib/sectionLibrary';
import { type Template } from '@shared/schema';

interface MainLayoutProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
  livePreview: React.ReactNode;
  isICU?: boolean;
}

export function MainLayout({
  children,
  selectedMenu,
  setSelectedMenu,
  selectedSubOption,
  setSelectedSubOption,
  livePreview,
  isICU = false,
}: MainLayoutProps & { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage();

  // Generate default medical notes sections (independent of template)
  const getDefaultMedicalNotesSections = () => {
    return [
      { key: "note-type", label: "Type", icon: <FileText className="w-6 h-6 text-blue-500 bg-blue-100 rounded-full p-1" /> },
      { key: "pmh", label: "PMH", icon: <Stethoscope className="w-6 h-6 text-emerald-600 bg-emerald-100 rounded-full p-1" /> },
      { key: "meds", label: "Meds", icon: <Pill className="w-6 h-6 text-purple-600 bg-purple-100 rounded-full p-1" /> },
      { key: "allergies-social", label: "Allergies & Social", icon: <Users className="w-6 h-6 text-pink-500 bg-pink-100 rounded-full p-1" /> },
      { key: "hpi", label: "HPI", icon: <ClipboardList className="w-6 h-6 text-cyan-600 bg-cyan-100 rounded-full p-1" /> },
      { key: "physical-exam", label: "Physical Exam", icon: <HeartPulse className="w-6 h-6 text-red-500 bg-red-100 rounded-full p-1" /> },
      ...(isICU ? [{ key: "ventilation", label: "Vent", icon: <Wind className="w-6 h-6 text-sky-500 bg-sky-100 rounded-full p-1" /> }] : []),
      { key: "labs", label: "Labs", icon: <TestTube className="w-6 h-6 text-yellow-600 bg-yellow-100 rounded-full p-1" /> },
      { key: "imagery", label: "Imagery", icon: <Image className="w-6 h-6 text-indigo-500 bg-indigo-100 rounded-full p-1" /> },
      { key: "impression", label: "IMP", icon: <Brain className="w-6 h-6 text-gray-700 bg-gray-100 rounded-full p-1" /> },
    ];
  };

  const MAIN_MENUS = [
    {
      key: "medical-notes",
      label: "Medical Notes",
      icon: <FileText className="w-5 h-5" />,
      subOptions: getDefaultMedicalNotesSections(),
    },
    {
      key: "templates",
      label: "Templates",
      icon: <FileText className="w-5 h-5" />,
      subOptions: [
        { key: "template-selector", label: "Select Template", icon: <FileText className="w-6 h-6 text-purple-500 bg-purple-100 rounded-full p-1" /> },
        { key: "template-manager", label: "Manage Templates", icon: <Sparkles className="w-6 h-6 text-indigo-500 bg-indigo-100 rounded-full p-1" /> },
      ],
    },
    {
      key: "smart-options",
      label: "Smart Functions",
      icon: <Sparkles className="w-5 h-5" />,
      subOptions: [
        { key: "dot-phrases", label: "Dot Phrases", icon: <ClipboardList className="w-6 h-6 text-green-500 bg-green-100 rounded-full p-1" /> },
      ],
    },
    {
      key: "calculations",
      label: "Calculations",
      icon: <Calculator className="w-5 h-5" />,
      subOptions: [],
    },
  ];

  const currentMenu = MAIN_MENUS.find((m) => m.key === selectedMenu) || MAIN_MENUS[0];
  const [medicalNotesOpen, setMedicalNotesOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [smartOptionsOpen, setSmartOptionsOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar className="medical-sidebar border-r border-gray-200">
          {/* Logo */}
          <div className="medical-header py-6 flex flex-col items-center">
            <span style={{ fontFamily: 'Inter, Manrope, Arial, sans-serif', fontWeight: 600, color: '#2D3748', fontSize: '1.35rem', letterSpacing: '-0.01em' }}>AriNote</span>
          </div>
          {/* Main menu */}
          <nav className="flex flex-col gap-3 px-3">
            {MAIN_MENUS.map((menu, idx) => (
              <div key={menu.key} className="menu-item">
                <button
                  className={`medical-nav-button ${selectedMenu === menu.key ? 'medical-nav-active' : ''}`}
                  onClick={() => {
                    setSelectedMenu(menu.key);
                    if (menu.key === "medical-notes") {
                      setMedicalNotesOpen((open) => !open);
                      if (!medicalNotesOpen && menu.subOptions.length > 0) {
                        setSelectedSubOption(menu.subOptions[0].key);
                      }
                    } else if (menu.key === "templates") {
                      setTemplatesOpen((open) => !open);
                      if (!templatesOpen && menu.subOptions.length > 0) {
                        setSelectedSubOption(menu.subOptions[0].key);
                      }
                    } else if (menu.key === "smart-options") {
                      setSmartOptionsOpen((open) => !open);
                    } else {
                      if (menu.subOptions.length > 0) {
                        setSelectedSubOption(menu.subOptions[0].key);
                      }
                    }
                  }}
                >
                  {menu.icon}
                  <span>{menu.label}</span>
                  {menu.key === "medical-notes" && (
                    <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${medicalNotesOpen ? "rotate-0" : "-rotate-90"}`} />
                  )}
                  {menu.key === "templates" && (
                    <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${templatesOpen ? "rotate-0" : "-rotate-90"}`} />
                  )}
                  {menu.key === "smart-options" && (
                    <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${smartOptionsOpen ? "rotate-0" : "-rotate-90"}`} />
                  )}
                </button>
                {menu.key === "medical-notes" && medicalNotesOpen && menu.subOptions.length > 0 && (
                  <nav className="flex flex-col gap-1 mt-2 ml-2">
                    {menu.subOptions.map((sub, subIdx) => (
                      <button
                        key={sub.key}
                        className={`medical-subnav-button ${selectedSubOption === sub.key ? 'medical-subnav-active' : ''}`}
                        onClick={() => setSelectedSubOption(sub.key)}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const nextIdx = (subIdx + 1) % menu.subOptions.length;
                            setSelectedSubOption(menu.subOptions[nextIdx].key);
                            // Move focus to the next button
                            const nextBtn = e.currentTarget.parentElement?.children[nextIdx] as HTMLButtonElement;
                            nextBtn?.focus();
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prevIdx = (subIdx - 1 + menu.subOptions.length) % menu.subOptions.length;
                            setSelectedSubOption(menu.subOptions[prevIdx].key);
                            // Move focus to the previous button
                            const prevBtn = e.currentTarget.parentElement?.children[prevIdx] as HTMLButtonElement;
                            prevBtn?.focus();
                          }
                        }}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </nav>
                )}
                {/* Templates subnav */}
                {menu.key === "templates" && templatesOpen && menu.subOptions.length > 0 && (
                  <nav className="flex flex-col gap-1 mt-2 ml-2">
                    {menu.subOptions.map((sub) => (
                      <button
                        key={sub.key}
                        className={`medical-subnav-button ${selectedSubOption === sub.key ? 'medical-subnav-active' : ''}`}
                        onClick={() => setSelectedSubOption(sub.key)}
                        tabIndex={0}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </nav>
                )}
                {/* Smart Options subnav toggle */}
                {menu.key === "smart-options" && smartOptionsOpen && menu.subOptions.length > 0 && (
                  <nav className="flex flex-col gap-1 mt-2 ml-2">
                    {menu.subOptions.map((sub) => (
                      <button
                        key={sub.key}
                        className={`medical-subnav-button ${selectedSubOption === sub.key ? 'medical-subnav-active' : ''}`}
                        onClick={() => setSelectedSubOption(sub.key)}
                        tabIndex={0}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            ))}
          </nav>
          {/* Language Switcher */}
          <div className="mt-auto flex flex-col items-center py-6">
            <button
              className="medical-language-button"
              onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
            >
              <Globe className="w-4 h-4" />
              {language === "fr" ? "Français" : "English"}
            </button>
          </div>
        </Sidebar>
        {/* Main content area */}
        <main className="medical-main-content">
          {selectedMenu === 'smart-options' && selectedSubOption === 'dot-phrases' ? (
            <DotPhraseManager />
          ) : selectedMenu === 'templates' && selectedSubOption === 'template-manager' ? (
            <TemplateManager />
          ) : selectedMenu === 'templates' && selectedSubOption === 'template-selector' ? (
            <TemplateSelectorPage />
          ) : (
            children
          )}
        </main>
        {/* Fixed preview panel on far right */}
        <aside className="medical-preview-panel">
          {livePreview}
        </aside>
      </div>
    </SidebarProvider>
  );
}