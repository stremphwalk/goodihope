import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MedicationAutoComplete } from '@/components/MedicationAutoComplete';
import { MedicationImageUpload } from '@/components/MedicationImageUpload';
import { Home, Hospital, Pill, X, ChevronUp, ChevronDown, RotateCcw, Hash, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createMedication, sortMedicationsByImportance, formatMedicationsForNote, getCommonDosages, frequencies, translateFrequency, categorizeMedication, getCategoryPriority, type SelectedMedication, type MedicationData } from '@/lib/medicationUtils';

interface MedicationSectionProps {
  medications: MedicationData;
  onMedicationsChange: (medications: MedicationData) => void;
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
  const showCommonDosages = !medication.isCustom && availableDosages.length > 0;

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

      {/* Dosage and Frequency Selection */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dosage Input */}
        <Input
          placeholder={language === 'fr' ? 'Dose' : 'Dose'}
          value={medication.dosage || ''}
          onChange={(e) => onDosageChange(medication.id, e.target.value)}
          className="h-6 w-16 text-xs rounded-full text-center border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        />

        {/* Frequency Input */}
        <Input
          placeholder={language === 'fr' ? 'Fréq' : 'Freq'}
          value={medication.frequency || ''}
          onChange={(e) => onFrequencyChange(medication.id, e.target.value)}
          className="h-6 w-12 text-xs rounded-full text-center border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        />
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
        onClick={() => onRemove(medication.name)}
        className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function MedicationSection({ medications, onMedicationsChange }: MedicationSectionProps) {
  const [medicationDosages, setMedicationDosages] = useState<Record<string, string[]>>({});
  const [reorderMode, setReorderMode] = useState(false);
  const [orderingQueue, setOrderingQueue] = useState<string[]>([]);
  const { language } = useLanguage();

  const handleHomeMedicationAdd = (medicationName: string, isCustom: boolean = false) => {
    const medication = createMedication(medicationName, isCustom);
    const updatedHomeMeds = [...medications.homeMedications, medication];
    onMedicationsChange({
      ...medications,
      homeMedications: updatedHomeMeds
    });
  };

  const handleHospitalMedicationAdd = (medicationName: string, isCustom: boolean = false) => {
    const medication = createMedication(medicationName, isCustom);
    const updatedHospitalMeds = [...medications.hospitalMedications, medication];
    onMedicationsChange({
      ...medications,
      hospitalMedications: updatedHospitalMeds
    });
  };

  const handleHomeMedicationRemove = (medicationName: string) => {
    const updatedHomeMeds = medications.homeMedications.filter(med => med.name !== medicationName);
    onMedicationsChange({
      ...medications,
      homeMedications: updatedHomeMeds
    });
  };

  const handleHospitalMedicationRemove = (medicationName: string) => {
    const updatedHospitalMeds = medications.hospitalMedications.filter(med => med.name !== medicationName);
    onMedicationsChange({
      ...medications,
      hospitalMedications: updatedHospitalMeds
    });
  };

  // Click-to-reorder functionality
  const handleMedicationClick = (medicationId: string, isHome: boolean) => {
    if (!reorderMode) return;
    
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    const clickedMed = targetMeds.find(med => med.id === medicationId);
    if (!clickedMed) return;
    
    const sectionKey = isHome ? 'home' : 'hospital';
    const fullMedKey = `${sectionKey}-${medicationId}`;
    
    // If already in queue, remove it
    if (orderingQueue.includes(fullMedKey)) {
      setOrderingQueue(prev => prev.filter(id => id !== fullMedKey));
      return;
    }
    
    // Add to queue
    setOrderingQueue(prev => [...prev, fullMedKey]);
  };

  const applyNewOrder = (isHome: boolean) => {
    const sectionKey = isHome ? 'home' : 'hospital';
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;

    // Get medications in queue order for this section
    const sectionQueue = orderingQueue
      .filter(key => key.startsWith(sectionKey))
      .map(key => key.replace(`${sectionKey}-`, ''));

    // If nothing in queue, do nothing
    if (sectionQueue.length === 0) return;

    // Get medications not in queue (maintain their relative order)
    const medsNotInQueue = targetMeds.filter(med => !sectionQueue.includes(med.id));

    // Create new order: queued medications first, then remaining medications
    const reorderedMeds = [
      ...sectionQueue.map(id => targetMeds.find(med => med.id === id)!),
      ...medsNotInQueue
    ];

    // Update the state with the new order
    onMedicationsChange({
      ...medications,
      [isHome ? 'homeMedications' : 'hospitalMedications']: reorderedMeds
    });

    // Clear queue and exit reorder mode
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
    
    // Auto-categorize medications if they don't have categories or have wrong categories
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
    
    onMedicationsChange({
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
    
    onMedicationsChange({
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
    
    onMedicationsChange({
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
    onMedicationsChange({
      ...medications,
      homeMedications: isHome ? updatedMeds : otherMeds,
      hospitalMedications: isHome ? otherMeds : updatedMeds
    });
  };

  // Load dosages for medications - only when medication names change, not order
  useEffect(() => {
    const loadDosages = async () => {
      const allMeds = [...medications.homeMedications, ...medications.hospitalMedications];
      
      // Only load dosages for medications we don't already have
      const newMeds = allMeds.filter(med => !medicationDosages[med.name]);
      
      if (newMeds.length === 0) return;
      
      console.log('Loading dosages for new medications:', newMeds.map(m => m.name));
      
      const dosagePromises = newMeds.map(async (med) => {
        if (!med.isCustom) {
          const dosages = await getCommonDosages(med.name);
          return { name: med.name, dosages };
        }
        return { name: med.name, dosages: [] };
      });
      
      const results = await Promise.all(dosagePromises);
      const newDosageMap: Record<string, string[]> = {};
      results.forEach(result => {
        newDosageMap[result.name] = result.dosages;
      });
      
      // Merge with existing dosages instead of replacing
      setMedicationDosages(prev => ({ ...prev, ...newDosageMap }));
    };

    loadDosages();
  }, [medications.homeMedications.length, medications.hospitalMedications.length, medications.homeMedications.map(m => m.name).join(','), medications.hospitalMedications.map(m => m.name).join(','), medicationDosages]);

  const getHomeMedicationNames = () => medications.homeMedications.map(med => med.name);
  const getHospitalMedicationNames = () => medications.hospitalMedications.map(med => med.name);

  const renderMedicationList = (meds: SelectedMedication[], isHome: boolean) => {
    const sectionKey = isHome ? 'home' : 'hospital';
    const hasQueuedMedications = orderingQueue.some(key => key.startsWith(sectionKey));
    
    return (
      <div className="space-y-2 mt-2">
        {/* Reorder Mode Controls */}
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
        
        {/* Medication List */}
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

  const medicationCount = medications.homeMedications.length + medications.hospitalMedications.length;

  return (
    <div className="flex flex-col h-full">
      {/* Instructions (no extra box, just padding) */}
      <div className="p-4">
        <span className="text-sm text-blue-800">
          {language === 'fr'
            ? 'Ajoutez, organisez et gérez les médicaments du patient. Utilisez les boutons pour réorganiser, trier ou marquer comme arrêté.'
            : 'Add, organize, and manage patient medications. Use the buttons to reorder, sort, or mark as discontinued.'}
        </span>
      </div>
      {/* Main Content (no extra card/box, just spacing) */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-8 p-6">
        {/* Home Medications */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {language === 'fr' ? 'Médicaments à domicile' : 'Home Medications'}
            </h4>
            <span className="text-sm text-gray-500">
              ({medications.homeMedications.length})
            </span>
          </div>
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
                  onMedicationsChange({
                    ...medications,
                    homeMedications: [...medications.homeMedications, ...newMeds]
                  });
                }
              }}
            />
          </div>
          {/* Reorder/Sort Controls */}
          {medications.homeMedications.length > 1 && (
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReorderMode(true)}
                className="h-6 px-2 text-xs bg-blue-100 text-blue-700"
              >
                <Hash className="h-3 w-3 mr-1" />
                {language === 'fr' ? 'Réorganiser' : 'Reorder'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sortMedications(true, 'importance')}
                className="h-6 px-2 text-xs bg-green-100 text-green-700"
              >
                {language === 'fr' ? 'Importance' : 'Auto-sort'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sortMedications(true, 'reset')}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {language === 'fr' ? 'Réinitialiser' : 'Reset'}
              </Button>
            </div>
          )}
          {renderMedicationList(medications.homeMedications, true)}
        </div>
        {/* Hospital Medications */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Hospital className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {language === 'fr' ? 'Médicaments hospitaliers' : 'Hospital Medications'}
            </h4>
            <span className="text-sm text-gray-500">
              ({medications.hospitalMedications.length})
            </span>
          </div>
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
                  onMedicationsChange({
                    ...medications,
                    hospitalMedications: [...medications.hospitalMedications, ...newMeds]
                  });
                }
              }}
            />
          </div>
          {/* Reorder/Sort Controls */}
          {medications.hospitalMedications.length > 1 && (
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReorderMode(true)}
                className="h-6 px-2 text-xs bg-blue-100 text-blue-700"
              >
                <Hash className="h-3 w-3 mr-1" />
                {language === 'fr' ? 'Réorganiser' : 'Reorder'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sortMedications(false, 'importance')}
                className="h-6 px-2 text-xs bg-green-100 text-green-700"
              >
                {language === 'fr' ? 'Importance' : 'Auto-sort'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sortMedications(false, 'reset')}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {language === 'fr' ? 'Réinitialiser' : 'Reset'}
              </Button>
            </div>
          )}
          {renderMedicationList(medications.hospitalMedications, false)}
        </div>
      </div>
    </div>
  );
}