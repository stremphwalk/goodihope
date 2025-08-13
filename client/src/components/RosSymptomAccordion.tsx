import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { rosSymptomOptions } from "@/constants/rosSymptomOptions";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClipboardList, HeartPulse, Activity, Apple, Brain, Shield, Search, Undo2, ChevronDown, ChevronRight, Expand, Minimize, Bone, Droplet, Sun, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SymptomDetailsModal } from '@/components/SymptomDetailsModal';
import { Button } from '@/components/ui/button';
import { type SelectedSymptom } from '@/utils/symptomTextUtils';

interface RosSymptomAccordionProps {
  selectedSymptoms: Record<string, Set<SelectedSymptom>>;
  setSelectedSymptoms: (updater: (prev: Record<string, Set<SelectedSymptom>>) => Record<string, Set<SelectedSymptom>>) => void;
}

const systemIcons: Record<string, React.ReactNode> = {
  neurologic: <Brain className="w-5 h-5 text-indigo-600 bg-indigo-100 rounded-full p-0.5" />,
  respiratory: <Activity className="w-5 h-5 text-cyan-600 bg-cyan-100 rounded-full p-0.5" />,
  cardiovascular: <HeartPulse className="w-5 h-5 text-rose-600 bg-rose-100 rounded-full p-0.5" />,
  gastrointestinal: <Apple className="w-5 h-5 text-yellow-600 bg-yellow-100 rounded-full p-0.5" />,
  genitourinary: <Shield className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />,
  rheumatologic: <Bone className="w-5 h-5 text-amber-700 bg-amber-100 rounded-full p-0.5" />,
  hematologic: <Droplet className="w-5 h-5 text-red-700 bg-red-100 rounded-full p-0.5" />,
  endocrine: <Sun className="w-5 h-5 text-orange-600 bg-orange-100 rounded-full p-0.5" />,
  ophthalmologic: <Eye className="w-5 h-5 text-sky-700 bg-sky-100 rounded-full p-0.5" />,
  default: <ClipboardList className="w-5 h-5 text-cyan-600 bg-cyan-100 rounded-full p-0.5" />
};

export const RosSymptomAccordion: React.FC<RosSymptomAccordionProps> = ({
  selectedSymptoms,
  setSelectedSymptoms,
}) => {
  const { language } = useLanguage();
  const getLabel = (obj: { en: string; fr: string }) => language === "fr" ? obj.fr : obj.en;
  const getDescription = (obj: { en: string; fr: string }) => language === "fr" ? obj.fr : obj.en;

  // Compute system order from available options to ensure coverage of all systems
  const systemOrder = useMemo(() => Object.keys(rosSymptomOptions), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set(systemOrder));  // All expanded by default
  const [selectedSymptomForEdit, setSelectedSymptomForEdit] = useState<{system: string; symptom: SelectedSymptom} | null>(null);
  const [actionHistory, setActionHistory] = useState<Array<{ system: string; symptom: SelectedSymptom; action: 'add' | 'remove' }>>([]);
  const shiftPressed = useRef(false);
  const lastSelected = useRef<{system: string; index: number} | null>(null);

  // Keep expanded state in sync if systems change (e.g., after code updates)
  useEffect(() => {
    setExpandedSystems(prev => {
      const next = new Set<string>();
      systemOrder.forEach(k => next.add(k));
      return next;
    });
  }, [systemOrder]);

  // All systems expanded? For global toggle
  const allExpanded = expandedSystems.size === systemOrder.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressed.current = true;
      if (e.ctrlKey && e.key.toLowerCase() === 'z' && actionHistory.length > 0) handleUndo();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressed.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [actionHistory]);

  const toggleSystem = (systemKey: string) => {
    setExpandedSystems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(systemKey)) newSet.delete(systemKey);
      else newSet.add(systemKey);
      return newSet;
    });
  };

  const toggleAllSystems = () => {
    if (allExpanded) {
      setExpandedSystems(new Set());  // Collapse all
    } else {
      setExpandedSystems(new Set(systemOrder));  // Expand all
    }
  };

  const handleSelectAllAll = () => {
    const allSelected = systemOrder.every(system => {
      const symptoms = rosSymptomOptions[system as keyof typeof rosSymptomOptions].symptoms;
      return (selectedSymptoms[system]?.size || 0) === symptoms.length;
    });
    setSelectedSymptoms(() => {
      const newObj: Record<string, Set<SelectedSymptom>> = {};
      systemOrder.forEach(systemKey => {
        const symptoms = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions].symptoms;
        newObj[systemKey] = allSelected ? new Set() : new Set(symptoms.map(s => ({ key: s.key, present: true })));
      });
      return newObj;
    });
  };

  const handleSelectAllSystem = (systemKey: string) => {
    setSelectedSymptoms(prev => {
      const symptoms = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions].symptoms;
      const currentSet = prev[systemKey] || new Set();
      const allSystemSelected = currentSet.size === symptoms.length;
      const newSet = allSystemSelected ? new Set<SelectedSymptom>() : new Set(symptoms.map(s => ({ key: s.key, present: true })));
      return { ...prev, [systemKey]: newSet };
    });
  };

  const handleSymptomToggle = (systemKey: string, symptomKey: string, index: number) => {
    setSelectedSymptoms(prev => {
      const newObj = { ...prev };
      if (!newObj[systemKey]) newObj[systemKey] = new Set();
      const systemSet = new Set(newObj[systemKey]);
      let symptomObj = Array.from(systemSet).find(s => s.key === symptomKey) || { key: symptomKey, present: true };

      if (systemSet.has(symptomObj)) {
        setActionHistory(prev => [...prev, {system: systemKey, symptom: symptomObj, action: 'remove' as 'remove'}].slice(-5));
        systemSet.delete(symptomObj);
      } else {
        setActionHistory(prev => [...prev, {system: systemKey, symptom: symptomObj, action: 'add' as 'add'}].slice(-5));
        systemSet.add(symptomObj);
        if (shiftPressed.current && lastSelected.current && lastSelected.current.system === systemKey) {
          const start = Math.min(lastSelected.current.index, index);
          const end = Math.max(lastSelected.current.index, index);
          const symptoms = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions].symptoms;
          if (start < 0 || end >= symptoms.length) {
            console.warn('Multi-select index out of bounds');
            return newObj; // Edge case: Prevent invalid adds
          }
          for (let i = start; i <= end; i++) {
            const multiSymptom = { key: symptoms[i].key, present: true };
            if (!Array.from(systemSet).some(s => s.key === multiSymptom.key)) {
              systemSet.add(multiSymptom);
            }
          }
        }
        lastSelected.current = {system: systemKey, index};
      }
      newObj[systemKey] = systemSet;
      return newObj;
    });
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) {
      console.warn('No actions to undo'); // Edge case check
      return;
    }
    const lastAction = actionHistory[actionHistory.length - 1];
    setSelectedSymptoms(prev => {
      const newObj = { ...prev };
      const systemSet = new Set(newObj[lastAction.system] || []);
      if (lastAction.action === 'add') {
        systemSet.delete(lastAction.symptom);
      } else {
        systemSet.add(lastAction.symptom);
      }
      newObj[lastAction.system] = systemSet;
      return newObj;
    });
    setActionHistory(prev => prev.slice(0, -1));
  };

  const handleSaveDetails = (system: string, symptomKey: string, severity?: 'mild' | 'moderate' | 'severe', note?: string) => {
    setSelectedSymptoms(prev => {
      const newObj = { ...prev };
      const systemSet = new Set(newObj[system]);
      const oldObj = Array.from(systemSet).find(s => s.key === symptomKey);
      if (!oldObj) {
        console.warn(`Symptom ${symptomKey} not found in ${system}`); // Edge case check
        return prev;
      }
      systemSet.delete(oldObj);
      systemSet.add({ ...oldObj, severity, note });
      newObj[system] = systemSet;
      return newObj;
    });
  };

  const filteredSymptoms = (systemKey: string) => {
    const symptoms = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions].symptoms;
    if (!searchQuery) return symptoms;
    return symptoms.filter(s => getLabel(s).toLowerCase().includes(searchQuery.toLowerCase()));
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-5">
        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={language === 'fr' ? 'Rechercher symptômes...' : 'Search symptoms...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleSelectAllAll}>
            {systemOrder.every(system => (selectedSymptoms[system]?.size || 0) === rosSymptomOptions[system as keyof typeof rosSymptomOptions].symptoms.length) 
              ? (language === 'fr' ? 'Tout Désélectionner' : 'Unselect All') 
              : (language === 'fr' ? 'Tout Sélectionner' : 'Select All')}
          </Button>
          <Button variant="outline" onClick={toggleAllSystems}>
            {allExpanded ? <Minimize className="w-4 h-4 mr-1" /> : <Expand className="w-4 h-4 mr-1" />}
            {allExpanded ? (language === 'fr' ? 'Tout Réduire' : 'Collapse All') : (language === 'fr' ? 'Tout Développer' : 'Expand All')}
          </Button>
          {actionHistory.length > 0 && (
            <Button variant="ghost" onClick={handleUndo} className="text-blue-600">
              <Undo2 className="w-4 h-4 mr-1" /> Undo
            </Button>
          )}
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemOrder.map((systemKey) => {
            const systemObj = rosSymptomOptions[systemKey as keyof typeof rosSymptomOptions];
            if (!systemObj) return null;
            const allSymptoms = systemObj.symptoms;
            const filtered = filteredSymptoms(systemKey);
            const rawSet = selectedSymptoms[systemKey] as any;
            const selectedSet: Set<SelectedSymptom> =
              rawSet instanceof Set ? rawSet : Array.isArray(rawSet) ? new Set(rawSet) : new Set<SelectedSymptom>();
            const selectedCount = selectedSet.size;
            const completion = (selectedCount / allSymptoms.length) * 100;
            const isExpanded = expandedSystems.has(systemKey);
            const allSystemSelected = selectedCount === allSymptoms.length;

            return (
              <div
                key={systemKey}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-3 flex flex-col transition-shadow hover:shadow-md"
              >
                {/* System Header */}
                <button
                  onClick={() => toggleSystem(systemKey)}
                  className="flex items-center justify-between mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {systemIcons[systemKey] || systemIcons.default}
                    <h3 className="text-base font-semibold text-gray-900">
                      {getLabel(systemObj.label)}
                    </h3>
                    <Badge variant="secondary" className="ml-2">
                      {selectedCount}/{allSymptoms.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={completion} className="w-20 h-2" />
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                  </div>
                </button>

                {/* Per-System Select/Reset Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSelectAllSystem(systemKey)}
                  className="mb-2 self-end"
                  disabled={allSymptoms.length === 0}
                >
                  {allSystemSelected ? (language === 'fr' ? 'Réinitialiser' : 'Reset') : (language === 'fr' ? 'Tout Sélectionner' : 'Select All')}
                </Button>

                {/* Symptoms List */}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 transition-all duration-300 ease-in-out">
                    {filtered.map((symptom, idx) => {
                      const symptomObj = Array.from(selectedSet).find(s => s.key === symptom.key) || { key: symptom.key, present: true };
                      const isSelected = selectedSet.has(symptomObj);
                      const hasDetails = symptomObj.severity || symptomObj.note;

                      return (
                        <Tooltip key={symptom.key}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex items-center px-2 py-1.5 rounded-full cursor-pointer transition-colors border hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-200 ${
                                isSelected ? 'bg-cyan-50 border-cyan-200' : 'bg-white'
                              } ${hasDetails ? 'ring-1 ring-cyan-300' : ''}`}
                              onClick={() => handleSymptomToggle(systemKey, symptom.key, idx)}
                              onDoubleClick={() => setSelectedSymptomForEdit({system: systemKey, symptom: symptomObj})}
                              tabIndex={0}
                              onKeyDown={e => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSymptomToggle(systemKey, symptom.key, idx);
                                } else if (e.key === 'Escape' && selectedSymptomForEdit) {
                                  setSelectedSymptomForEdit(null);
                                }
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleSymptomToggle(systemKey, symptom.key, idx)}
                                id={`symptom-${systemKey}-${symptom.key}`}
                                className="rounded-full border-cyan-300 focus:ring-cyan-400"
                              />
                              <label htmlFor={`symptom-${systemKey}-${symptom.key}`} className="ml-2 flex-1 cursor-pointer select-none text-xs font-medium">
                                {getLabel(symptom)}
                                {hasDetails && <Badge variant="outline" className="ml-1 text-xs">Details</Badge>}
                              </label>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{getDescription(symptom.description)}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {filtered.length === 0 && <p className="text-xs text-gray-400 col-span-2 text-center py-2">No matching symptoms</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Symptom Details Modal */}
        {selectedSymptomForEdit && (
          <SymptomDetailsModal
            isOpen={!!selectedSymptomForEdit}
            onClose={() => setSelectedSymptomForEdit(null)}
            symptomKey={selectedSymptomForEdit.symptom.key}
            currentSeverity={selectedSymptomForEdit.symptom.severity}
            currentNote={selectedSymptomForEdit.symptom.note}
            onSave={(severity, note) => handleSaveDetails(selectedSymptomForEdit.system, selectedSymptomForEdit.symptom.key, severity, note)}
            description={rosSymptomOptions[selectedSymptomForEdit.system as keyof typeof rosSymptomOptions].symptoms
              .find(s => s.key === selectedSymptomForEdit.symptom.key)?.description || {en: '', fr: ''}}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default RosSymptomAccordion;