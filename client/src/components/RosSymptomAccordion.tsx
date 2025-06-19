import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { rosSymptomOptions } from "@/constants/rosSymptomOptions";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClipboardList, HeartPulse, Activity, Apple, Brain, Shield } from "lucide-react";

interface RosSymptomAccordionProps {
  selectedSymptoms: Record<string, Set<string>>;
  setSelectedSymptoms: (updater: (prev: Record<string, Set<string>>) => Record<string, Set<string>>) => void;
}

const systemIcons: Record<string, React.ReactNode> = {
  neurologic: <Brain className="w-5 h-5 text-indigo-600 bg-indigo-100 rounded-full p-0.5" />,
  respiratory: <Activity className="w-5 h-5 text-cyan-600 bg-cyan-100 rounded-full p-0.5" />,
  cardiovascular: <HeartPulse className="w-5 h-5 text-rose-600 bg-rose-100 rounded-full p-0.5" />,
  gastrointestinal: <Apple className="w-5 h-5 text-yellow-600 bg-yellow-100 rounded-full p-0.5" />,
  genitourinary: <Shield className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />,
};

const systemOrder = [
  "neurologic",
  "respiratory",
  "cardiovascular",
  "gastrointestinal",
  "genitourinary"
];

export const RosSymptomAccordion: React.FC<RosSymptomAccordionProps> = ({
  selectedSymptoms,
  setSelectedSymptoms,
}) => {
  const { language } = useLanguage();
  const getLabel = (obj: { en: string; fr: string }) => language === "fr" ? obj.fr : obj.en;

  // Overarching select all/clear all logic
  const allSystemKeys = systemOrder;
  const allSymptomKeys = allSystemKeys.flatMap(systemKey => rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions].symptoms.map(s => s.key));
  const allSelected = allSystemKeys.every(systemKey => {
    const symptoms = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions].symptoms;
    return selectedSymptoms[systemKey]?.size === symptoms.length;
  });

  const handleSelectAllAll = () => {
    if (allSelected) {
      // Clear all
      setSelectedSymptoms(() => {
        const cleared: Record<string, Set<string>> = {};
        allSystemKeys.forEach(systemKey => {
          cleared[systemKey] = new Set();
        });
        return cleared;
      });
    } else {
      // Select all
      setSelectedSymptoms(() => {
        const all: Record<string, Set<string>> = {};
        allSystemKeys.forEach(systemKey => {
          const symptoms = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions].symptoms;
          all[systemKey] = new Set(symptoms.map(s => s.key));
        });
        return all;
      });
    }
  };

  return (
    <div className="w-full">
      {/* Overarching Select All/Clear All */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          className="text-xs px-3 py-1 rounded border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
          onClick={handleSelectAllAll}
        >
          {allSelected ? (language === 'fr' ? 'Tout effacer' : 'Clear All') : (language === 'fr' ? 'Tout sélectionner' : 'Select All')}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systemOrder.map((systemKey) => {
          const systemObj = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions];
          if (!systemObj) return null;
          const symptoms = systemObj.symptoms;
          const systemLabel = getLabel(systemObj.label);
          const selectedCount = selectedSymptoms[systemKey]?.size || 0;
          const allSystemSelected = selectedSymptoms[systemKey]?.size === symptoms.length;

          // Per-system select all/clear all
          const handleSelectAllSystem = () => {
            setSelectedSymptoms(prev => {
              const newSet = new Set<string>();
              if (!allSystemSelected) {
                symptoms.forEach(s => newSet.add(s.key));
              }
              return { ...prev, [systemKey]: newSet };
            });
          };

          return (
            <div key={systemKey} className="bg-white rounded-xl shadow p-3 flex flex-col h-full">
              {/* System Header */}
              <div className="flex items-center gap-2 mb-1 justify-between">
                <span className="flex items-center gap-2">
                  {systemIcons[systemKey] || <ClipboardList className="w-5 h-5 text-cyan-600 bg-cyan-100 rounded-full p-0.5" />}
                  <h3 className="text-base font-semibold text-gray-900">
                    {systemLabel}
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 border-cyan-200">
                        {selectedCount} {language === 'fr' ? 'sélectionné(s)' : 'selected'}
                      </Badge>
                    )}
                  </h3>
                </span>
                <button
                  type="button"
                  className="text-xs px-2 py-0.5 rounded border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  onClick={handleSelectAllSystem}
                >
                  {allSystemSelected ? (language === 'fr' ? 'Tout effacer' : 'Clear All') : (language === 'fr' ? 'Tout sélectionner' : 'Select All')}
                </button>
              </div>
              {/* Symptoms List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                {symptoms.map((symptom: any) => (
                  <div
                    key={symptom.key}
                    className={`flex items-center px-2 py-1 rounded-full cursor-pointer transition-all border border-transparent hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-200 ${selectedSymptoms[systemKey]?.has(symptom.key) ? 'bg-cyan-100 border-cyan-200' : ''}`}
                    tabIndex={0}
                    onClick={() => {
                      setSelectedSymptoms(prev => {
                        const newSet = new Set(prev[systemKey] || []);
                        if (newSet.has(symptom.key)) {
                          newSet.delete(symptom.key);
                        } else {
                          newSet.add(symptom.key);
                        }
                        return { ...prev, [systemKey]: newSet };
                      });
                    }}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setSelectedSymptoms(prev => {
                          const newSet = new Set(prev[systemKey] || []);
                          if (newSet.has(symptom.key)) {
                            newSet.delete(symptom.key);
                          } else {
                            newSet.add(symptom.key);
                          }
                          return { ...prev, [systemKey]: newSet };
                        });
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedSymptoms[systemKey]?.has(symptom.key) || false}
                      onCheckedChange={() => {
                        setSelectedSymptoms(prev => {
                          const newSet = new Set(prev[systemKey] || []);
                          if (newSet.has(symptom.key)) {
                            newSet.delete(symptom.key);
                          } else {
                            newSet.add(symptom.key);
                          }
                          return { ...prev, [systemKey]: newSet };
                        });
                      }}
                      id={`symptom-${systemKey}-${symptom.key}`}
                      tabIndex={-1}
                      className="rounded-full border-cyan-300 focus:ring-cyan-400"
                    />
                    <label htmlFor={`symptom-${systemKey}-${symptom.key}`} className="ml-2 flex-1 cursor-pointer select-none text-xs font-medium">
                      {getLabel(symptom)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
