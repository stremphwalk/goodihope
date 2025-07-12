import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, Hospital, Pill, X, ChevronUp, ChevronDown, RotateCcw, Hash, CheckCircle } from 'lucide-react';
import { MedicationAutoComplete } from '@/components/MedicationAutoComplete';
import { MedicationImageUpload } from '@/components/MedicationImageUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import { WidgetInstance } from '@/types/widgets';
import { 
  createMedication, 
  sortMedicationsByImportance, 
  formatMedicationsForNote, 
  getCommonDosages, 
  frequencies, 
  translateFrequency, 
  categorizeMedication, 
  getCategoryPriority,
  type SelectedMedication, 
  type MedicationData 
} from '@/lib/medicationUtils';

interface MedicationWidgetProps extends Omit<WidgetInstance, 'data' | 'onDataChange'> {
  data: MedicationData;
  onDataChange: (data: MedicationData) => void;
}

interface MedicationItemProps {
  medication: SelectedMedication;
  onRemove: (medicationName: string) => void;
  onDosageChange: (medicationId: string, dosage: string) => void;
  onFrequencyChange: (medicationId: string, frequency: string) => void;
  onClick: (medicationId: string) => void;
  onToggleDiscontinued: (medicationId: string) => void;
  availableDosages: string[];
  language: 'en' | 'fr';
  position: number;
  queuePosition?: number;
  isReorderMode: boolean;
  isSelected: boolean;
}

function MedicationItem({ 
  medication, 
  onRemove, 
  onDosageChange, 
  onFrequencyChange, 
  onClick,
  onToggleDiscontinued,
  availableDosages, 
  language,
  position,
  queuePosition,
  isReorderMode,
  isSelected
}: MedicationItemProps) {
  const handleCardClick = () => {
    if (isReorderMode) {
      onClick(medication.id);
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded-md border min-h-[44px] transition-all duration-200 ${
        isReorderMode 
          ? `cursor-pointer ${
              isSelected 
                ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-300' 
                : 'bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300'
            }`
          : 'bg-gray-50 dark:bg-gray-800'
      }`}
      onClick={handleCardClick}
    >
      {/* Position Display / Queue Position */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isReorderMode && queuePosition ? (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {queuePosition}
            </div>
            <span className="text-xs text-gray-400">→</span>
            <span className="text-xs text-gray-500">{position}</span>
          </div>
        ) : (
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full flex items-center justify-center">
            {position}
          </div>
        )}
      </div>
      
      <Pill className="h-3 w-3 text-blue-600 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
            {medication.name}
          </span>
        </div>
      </div>

      {/* Dosage and Frequency Section */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {/* Input Fields */}
        <div className="flex items-center gap-1">
          <Input
            placeholder={language === 'fr' ? 'Dose' : 'Dose'}
            defaultValue={medication.dosage || ''}
            onBlur={(e) => onDosageChange(medication.id, e.target.value)}
            className="h-6 w-16 text-xs text-center border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <Input
            placeholder={language === 'fr' ? 'Fréq' : 'Freq'}
            defaultValue={medication.frequency || ''}
            onBlur={(e) => onFrequencyChange(medication.id, e.target.value)}
            className="h-6 w-12 text-xs text-center border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
        </div>
        
        {/* Common Dosages Bubbles */}
        {!medication.isCustom && availableDosages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableDosages.slice(0, 3).map(dosage => (
              <button
                key={dosage}
                onClick={(e) => { e.stopPropagation(); onDosageChange(medication.id, dosage); }}
                className={`px-1.5 py-0.5 text-xs rounded-full border transition-all hover:scale-105 ${
                  medication.dosage === dosage 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                {dosage}
              </button>
            ))}
          </div>
        )}
        
        {/* Common Frequencies Bubbles */}
        <div className="flex flex-wrap gap-1">
          {['DIE', 'BID', 'TID'].map(freq => (
            <button
              key={freq}
              onClick={(e) => { e.stopPropagation(); onFrequencyChange(medication.id, freq); }}
              className={`px-1.5 py-0.5 text-xs rounded-full border transition-all hover:scale-105 ${
                medication.frequency === freq 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-green-400'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onToggleDiscontinued(medication.id); }}
        className={`flex-shrink-0 h-6 px-2 text-xs font-bold border-red-500 text-red-600 hover:bg-red-50 hover:text-white hover:bg-red-600 transition-colors ${medication.isDiscontinued ? 'bg-red-600 text-white' : ''}`}
        title={language === 'fr' ? 'Marquer comme D/C (arrêté)' : 'Mark as D/C (discontinued)'}
      >
        D/C
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onRemove(medication.name); }}
        className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export const MedicationWidget: React.FC<MedicationWidgetProps> = ({
  data,
  onDataChange,
  mode = 'interactive',
  isReadOnly = false
}) => {
  const [medicationDosages, setMedicationDosages] = useState<Record<string, string[]>>({});
  const [reorderMode, setReorderMode] = useState(false);
  const [orderingQueue, setOrderingQueue] = useState<string[]>([]);
  const { language } = useLanguage();

  // Initialize with default data structure if empty
  const medications: MedicationData = data?.homeMedications ? data : {
    homeMedications: [],
    hospitalMedications: []
  };

  // Load dosages for new medications
  useEffect(() => {
    const loadDosages = async () => {
      const allMeds = [...medications.homeMedications, ...medications.hospitalMedications];
      const newMeds = allMeds.filter(med => !med.isCustom && !medicationDosages[med.name]);
      
      if (newMeds.length === 0) return;
      
      const dosagePromises = newMeds.map(async (med) => {
        const dosages = await getCommonDosages(med.name);
        return { name: med.name, dosages };
      });
      
      const results = await Promise.all(dosagePromises);
      const newDosageMap: Record<string, string[]> = {};
      results.forEach(result => {
        newDosageMap[result.name] = result.dosages;
      });
      
      setMedicationDosages(prev => ({ ...prev, ...newDosageMap }));
    };

    loadDosages();
  }, [medications.homeMedications.length, medications.hospitalMedications.length]);

  const handleHomeMedicationAdd = (medicationName: string, isCustom: boolean = false) => {
    const medication = createMedication(medicationName, isCustom);
    const updatedHomeMeds = [...medications.homeMedications, medication];
    onDataChange({
      ...medications,
      homeMedications: updatedHomeMeds
    });
  };

  const handleHospitalMedicationAdd = (medicationName: string, isCustom: boolean = false) => {
    const medication = createMedication(medicationName, isCustom);
    const updatedHospitalMeds = [...medications.hospitalMedications, medication];
    onDataChange({
      ...medications,
      hospitalMedications: updatedHospitalMeds
    });
  };

  const handleHomeMedicationRemove = (medicationName: string) => {
    const updatedHomeMeds = medications.homeMedications.filter(med => med.name !== medicationName);
    onDataChange({
      ...medications,
      homeMedications: updatedHomeMeds
    });
  };

  const handleHospitalMedicationRemove = (medicationName: string) => {
    const updatedHospitalMeds = medications.hospitalMedications.filter(med => med.name !== medicationName);
    onDataChange({
      ...medications,
      hospitalMedications: updatedHospitalMeds
    });
  };

  const handleMedicationClick = (medicationId: string, isHome: boolean) => {
    if (!reorderMode) return;
    
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    const clickedMed = targetMeds.find(med => med.id === medicationId);
    if (!clickedMed) return;
    
    const sectionKey = isHome ? 'home' : 'hospital';
    const fullMedKey = `${sectionKey}-${medicationId}`;
    
    if (orderingQueue.includes(fullMedKey)) {
      setOrderingQueue(prev => prev.filter(id => id !== fullMedKey));
      return;
    }
    
    setOrderingQueue(prev => [...prev, fullMedKey]);
  };

  const applyNewOrder = (isHome: boolean) => {
    const sectionKey = isHome ? 'home' : 'hospital';
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;

    const sectionQueue = orderingQueue
      .filter(key => key.startsWith(sectionKey))
      .map(key => key.replace(`${sectionKey}-`, ''));

    if (sectionQueue.length === 0) return;

    const medsNotInQueue = targetMeds.filter(med => !sectionQueue.includes(med.id));

    const reorderedMeds = [
      ...sectionQueue.map(id => targetMeds.find(med => med.id === id)!),
      ...medsNotInQueue
    ];

    onDataChange({
      ...medications,
      [isHome ? 'homeMedications' : 'hospitalMedications']: reorderedMeds
    });

    setOrderingQueue(prev => prev.filter(key => !key.startsWith(sectionKey)));
    setReorderMode(false);
  };

  const cancelReorder = () => {
    setReorderMode(false);
    setOrderingQueue([]);
  };

  const sortMedications = (isHome: boolean, sortBy: 'alphabetical' | 'category' | 'importance' | 'reset') => {
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    let sortedMeds = [...targetMeds];
    
    sortedMeds = sortedMeds.map(med => ({
      ...med,
      category: categorizeMedication(med.name)
    }));
    
    switch (sortBy) {
      case 'alphabetical':
        sortedMeds.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        sortedMeds.sort((a, b) => {
          const priorityA = getCategoryPriority(a.category);
          const priorityB = getCategoryPriority(b.category);
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          return a.name.localeCompare(b.name);
        });
        break;
      case 'importance':
        sortedMeds = sortMedicationsByImportance(sortedMeds);
        break;
      case 'reset':
        sortedMeds.sort((a, b) => a.addedAt - b.addedAt);
        break;
    }
    
    onDataChange({
      ...medications,
      [isHome ? 'homeMedications' : 'hospitalMedications']: sortedMeds
    });
  };

  const updateMedicationDosage = (medicationName: string, dosage: string, isHome: boolean) => {
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    const otherMeds = isHome ? medications.hospitalMedications : medications.homeMedications;
    
    const updatedMeds = targetMeds.map(med => 
      med.name === medicationName ? { ...med, dosage } : med
    );
    
    onDataChange({
      ...medications,
      homeMedications: isHome ? updatedMeds : otherMeds,
      hospitalMedications: isHome ? otherMeds : updatedMeds
    });
  };

  const updateMedicationFrequency = (medicationName: string, frequency: string, isHome: boolean) => {
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    const otherMeds = isHome ? medications.hospitalMedications : medications.homeMedications;
    
    const updatedMeds = targetMeds.map(med => 
      med.name === medicationName ? { ...med, frequency } : med
    );
    
    onDataChange({
      ...medications,
      homeMedications: isHome ? updatedMeds : otherMeds,
      hospitalMedications: isHome ? otherMeds : updatedMeds
    });
  };

  const toggleMedicationDiscontinued = (medicationId: string, isHome: boolean) => {
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    const otherMeds = isHome ? medications.hospitalMedications : medications.homeMedications;
    const updatedMeds = targetMeds.map(med =>
      med.id === medicationId ? { ...med, isDiscontinued: !med.isDiscontinued } : med
    );
    onDataChange({
      ...medications,
      homeMedications: isHome ? updatedMeds : otherMeds,
      hospitalMedications: isHome ? otherMeds : updatedMeds
    });
  };

  const getHomeMedicationNames = () => medications.homeMedications.map(med => med.name);
  const getHospitalMedicationNames = () => medications.hospitalMedications.map(med => med.name);

  const renderMedicationList = (meds: SelectedMedication[], isHome: boolean) => {
    const sectionKey = isHome ? 'home' : 'hospital';
    const hasQueuedMedications = orderingQueue.some(key => key.startsWith(sectionKey));
    
    return (
      <div className="space-y-2 mt-2">
        {meds.length > 1 && (
          <div className="flex gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
            {!reorderMode ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReorderMode(true)}
                  className="h-6 px-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {language === 'fr' ? 'Cliquer pour réorganiser' : 'Click to reorder'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sortMedications(isHome, 'importance')}
                  className="h-6 px-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                >
                  {language === 'fr' ? 'Importance' : 'Auto-sort'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sortMedications(isHome, 'reset')}
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {language === 'fr' ? 'Réinitialiser' : 'Reset'}
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mr-2">
                  {language === 'fr' ? 'Mode réorganisation:' : 'Reorder mode:'}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">
                  {language === 'fr' ? 'Cliquez les médicaments dans l\'ordre désiré' : 'Click medications in desired order'}
                </span>
                {hasQueuedMedications && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => applyNewOrder(isHome)}
                    className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {language === 'fr' ? 'Appliquer' : 'Apply'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelReorder}
                  className="h-6 px-2 text-xs"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
              </>
            )}
          </div>
        )}
        
        {meds.map((med, index) => {
          const commonDosages = medicationDosages[med.name] || [];
          const fullMedKey = `${sectionKey}-${med.id}`;
          const queueIndex = orderingQueue.indexOf(fullMedKey);
          const queuePosition = queueIndex >= 0 ? queueIndex + 1 : undefined;
          const isSelected = queueIndex >= 0;
          
          return (
            <MedicationItem
              key={`${med.id}-${index}`}
              medication={med}
              onRemove={isHome ? handleHomeMedicationRemove : handleHospitalMedicationRemove}
              onDosageChange={(medicationId, dosage) => {
                const medication = meds.find(m => m.id === medicationId);
                if (medication) {
                  updateMedicationDosage(medication.name, dosage, isHome);
                }
              }}
              onFrequencyChange={(medicationId, frequency) => {
                const medication = meds.find(m => m.id === medicationId);
                if (medication) {
                  updateMedicationFrequency(medication.name, frequency, isHome);
                }
              }}
              onClick={(medicationId) => handleMedicationClick(medicationId, isHome)}
              onToggleDiscontinued={(medicationId) => toggleMedicationDiscontinued(medicationId, isHome)}
              availableDosages={commonDosages}
              language={language}
              position={index + 1}
              queuePosition={queuePosition}
              isReorderMode={reorderMode}
              isSelected={isSelected}
            />
          );
        })}
      </div>
    );
  };

  if (mode === 'text') {
    // Generate formatted text for medications
    const formatMedicationsText = (data: MedicationData) => {
      let output = '';
      
      if (data.homeMedications.length > 0) {
        output += 'Home Medications:\n';
        data.homeMedications.forEach((med, index) => {
          const dosage = med.dosage ? ` ${med.dosage}` : '';
          const frequency = med.frequency ? ` ${med.frequency}` : '';
          const discontinued = med.isDiscontinued ? ' (D/C)' : '';
          output += `${index + 1}. ${med.name}${dosage}${frequency}${discontinued}\n`;
        });
        output += '\n';
      }
      
      if (data.hospitalMedications.length > 0) {
        output += 'Hospital Medications:\n';
        data.hospitalMedications.forEach((med, index) => {
          const dosage = med.dosage ? ` ${med.dosage}` : '';
          const frequency = med.frequency ? ` ${med.frequency}` : '';
          const discontinued = med.isDiscontinued ? ' (D/C)' : '';
          output += `${index + 1}. ${med.name}${dosage}${frequency}${discontinued}\n`;
        });
      }
      
      return output.trim() || 'No medications documented';
    };

    return (
      <div className="p-4 bg-gray-50 rounded border">
        <pre className="text-sm whitespace-pre-wrap">
          {formatMedicationsText(medications)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Home Medications */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Home className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {language === 'fr' ? 'Médicaments à domicile' : 'Home Medications'}
          </h4>
          <span className="text-xs text-gray-500">
            ({medications.homeMedications.length})
          </span>
        </div>
        
        {!isReadOnly && (
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <MedicationAutoComplete 
              onMedicationAdd={handleHomeMedicationAdd}
              selectedMedications={getHomeMedicationNames()}
              onMedicationRemove={handleHomeMedicationRemove}
              placeholder={language === 'fr' ? 'Ajouter un médicament à domicile...' : 'Add home medication...'}
            />
            <MedicationImageUpload 
              onMedicationsExtracted={(extractedMeds, isHome) => {
                if (isHome) {
                  const newMeds = extractedMeds.filter(extracted => 
                    !medications.homeMedications.some(home => home.name === extracted.name)
                  );
                  onDataChange({
                    ...medications,
                    homeMedications: [...medications.homeMedications, ...newMeds]
                  });
                }
              }}
            />
          </div>
        )}
        
        {renderMedicationList(medications.homeMedications, true)}
      </div>

      {/* Hospital Medications */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Hospital className="w-4 h-4 text-green-600" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {language === 'fr' ? 'Médicaments hospitaliers' : 'Hospital Medications'}
          </h4>
          <span className="text-xs text-gray-500">
            ({medications.hospitalMedications.length})
          </span>
        </div>
        
        {!isReadOnly && (
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <MedicationAutoComplete 
              onMedicationAdd={handleHospitalMedicationAdd}
              selectedMedications={getHospitalMedicationNames()}
              onMedicationRemove={handleHospitalMedicationRemove}
              placeholder={language === 'fr' ? 'Ajouter un médicament hospitalier...' : 'Add hospital medication...'}
            />
            <MedicationImageUpload 
              onMedicationsExtracted={(extractedMeds, isHome) => {
                if (!isHome) {
                  const newMeds = extractedMeds.filter(extracted => 
                    !medications.hospitalMedications.some(hosp => hosp.name === extracted.name)
                  );
                  onDataChange({
                    ...medications,
                    hospitalMedications: [...medications.hospitalMedications, ...newMeds]
                  });
                }
              }}
            />
          </div>
        )}
        
        {renderMedicationList(medications.hospitalMedications, false)}
      </div>
    </div>
  );
};