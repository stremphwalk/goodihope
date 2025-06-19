import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MedicationAutoComplete } from '@/components/MedicationAutoComplete';
import { MedicationImageUpload } from '@/components/MedicationImageUpload';
import { Home, Hospital, Pill, X, GripVertical, ArrowUpDown, ChevronUp, ChevronDown, RotateCcw, Ban } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createMedication, sortMedicationsByImportance, formatMedicationsForNote, getCommonDosages, frequencies, type SelectedMedication, type MedicationData } from '@/lib/medicationUtils';
import { arrayMove } from '@dnd-kit/sortable';

interface MedicationSectionProps {
  medications: MedicationData;
  onMedicationsChange: (medications: MedicationData) => void;
}

// Sortable medication item component
interface SortableMedicationItemProps {
  medication: SelectedMedication;
  onRemove: (name: string) => void;
  onDosageChange: (id: string, dosage: string) => void;
  onFrequencyChange: (id: string, frequency: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveToPosition: (id: string, position: number) => void;
  onToggleDiscontinued: (id: string) => void;
  availableDosages: string[];
  language: string;
  position: number;
  totalItems: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function SortableMedicationItem({ 
  medication, 
  onRemove, 
  onDosageChange, 
  onFrequencyChange, 
  onMoveUp,
  onMoveDown,
  onMoveToPosition,
  onToggleDiscontinued,
  availableDosages, 
  language,
  position,
  totalItems,
  canMoveUp,
  canMoveDown
}: SortableMedicationItemProps) {
  const [showPositionInput, setShowPositionInput] = useState(false);
  const [positionValue, setPositionValue] = useState(position.toString());

  const showCommonDosages = !medication.isCustom && availableDosages.length > 0;

  const handlePositionSubmit = () => {
    const newPos = parseInt(positionValue);
    if (!isNaN(newPos) && newPos >= 1 && newPos <= totalItems) {
      onMoveToPosition(medication.id, newPos);
    }
    setShowPositionInput(false);
    setPositionValue(position.toString());
  };

  useEffect(() => {
    setPositionValue(position.toString());
  }, [position]);

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border min-h-[44px]">
      {/* Position Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {showPositionInput ? (
          <Input
            type="number"
            min={1}
            max={totalItems}
            value={positionValue}
            onChange={(e) => setPositionValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePositionSubmit();
              if (e.key === 'Escape') {
                setShowPositionInput(false);
                setPositionValue(position.toString());
              }
            }}
            onBlur={handlePositionSubmit}
            className="w-12 h-6 text-xs text-center"
            autoFocus
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPositionInput(true)}
            className="p-1 h-6 w-8 text-xs text-gray-500 hover:text-gray-700"
          >
            {position}
          </Button>
        )}
        
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveUp(medication.id)}
            disabled={!canMoveUp}
            className="p-0 h-3 w-4 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveDown(medication.id)}
            disabled={!canMoveDown}
            className="p-0 h-3 w-4 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <Pill className="h-3 w-3 text-blue-600 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{medication.name}</span>
          <Badge 
            variant={medication.isDiscontinued ? "destructive" : "secondary"} 
            className={`text-xs ${medication.isDiscontinued ? '' : 'bg-gray-200 text-gray-600 border-gray-300'}`}
          >
            D/C
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {showCommonDosages && availableDosages.length > 0 ? (
            <select
              value={medication.dosage || ''}
              onChange={(e) => onDosageChange(medication.id, e.target.value)}
              className="px-2 py-1 text-xs border rounded w-20 bg-white dark:bg-gray-700"
            >
              <option value="">{language === 'fr' ? 'Dose' : 'Dose'}</option>
              {availableDosages.map(dosage => (
                <option key={dosage} value={dosage}>{dosage}</option>
              ))}
            </select>
          ) : (
            <Input
              placeholder={language === 'fr' ? 'Dose...' : 'Dose...'}
              value={medication.dosage || ''}
              onChange={(e) => onDosageChange(medication.id, e.target.value)}
              className="w-20 h-7 text-xs"
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleDiscontinued(medication.id)}
          className={`flex-shrink-0 h-6 px-2 text-xs font-bold border-red-500 text-red-600 hover:bg-red-50 hover:text-white hover:bg-red-600 transition-colors ${medication.isDiscontinued ? 'bg-red-600 text-white' : ''}`}
          title={language === 'fr' ? 'Marquer comme D/C (arrêté)' : 'Mark as D/C (discontinued)'}
        >
          D/C
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(medication.name)}
          className="flex-shrink-0 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function MedicationSection({ medications, onMedicationsChange }: MedicationSectionProps) {
  const [medicationDosages, setMedicationDosages] = useState<Record<string, string[]>>({});
  const { language } = useLanguage();

  // Removed unreliable drag-and-drop sensors

  const handleHomeMedicationAdd = (medicationName: string, isCustom: boolean = false) => {
    const medication = createMedication(medicationName, isCustom);
    const updatedHomeMeds = [...medications.homeMedications, medication];
    onMedicationsChange({
      ...medications,
      homeMedications: updatedHomeMeds
    });
    
    // Fetch dosages for new medication if not custom
    if (!isCustom && !medicationDosages[medicationName]) {
      getCommonDosages(medicationName).then(dosages => {
        setMedicationDosages(prev => ({
          ...prev,
          [medicationName]: dosages
        }));
      });
    }
  };

  const handleHomeMedicationRemove = (medicationName: string) => {
    const updatedHomeMeds = medications.homeMedications.filter(med => med.name !== medicationName);
    onMedicationsChange({
      ...medications,
      homeMedications: updatedHomeMeds
    });
  };

  const handleHospitalMedicationAdd = (medicationName: string, isCustom: boolean = false) => {
    // Check if this medication already exists in home medications
    const isDuplicate = medications.homeMedications.some(med => med.name === medicationName);
    if (isDuplicate) {
      return; // Don't add duplicates
    }

    const medication = createMedication(medicationName, isCustom);
    const updatedHospitalMeds = [...medications.hospitalMedications, medication];
    onMedicationsChange({
      ...medications,
      hospitalMedications: updatedHospitalMeds
    });
    
    // Fetch dosages for new medication if not custom
    if (!isCustom && !medicationDosages[medicationName]) {
      getCommonDosages(medicationName).then(dosages => {
        setMedicationDosages(prev => ({
          ...prev,
          [medicationName]: dosages
        }));
      });
    }
  };

  const handleHospitalMedicationRemove = (medicationName: string) => {
    const updatedHospitalMeds = medications.hospitalMedications.filter(med => med.name !== medicationName);
    onMedicationsChange({
      ...medications,
      hospitalMedications: updatedHospitalMeds
    });
  };

  const handleExtractedMedications = (extractedMeds: SelectedMedication[], isHome: boolean) => {
    if (isHome) {
      // Append extracted medications in the order received, no auto-sort
      const updatedHomeMeds = [...medications.homeMedications, ...extractedMeds];
      onMedicationsChange({
        ...medications,
        homeMedications: updatedHomeMeds
      });
    } else {
      // Filter out medications that already exist in home medications
      const newHospitalMeds = extractedMeds.filter(extracted => 
        !medications.homeMedications.some(home => home.name === extracted.name)
      );
      // Append in the order received
      const updatedHospitalMeds = [...medications.hospitalMedications, ...newHospitalMeds];
      onMedicationsChange({
        ...medications,
        hospitalMedications: updatedHospitalMeds
      });
    }
  };

  const getHomeMedicationNames = () => medications.homeMedications.map(med => med.name);
  const getHospitalMedicationNames = () => medications.hospitalMedications.map(med => med.name);

  // Alternative reordering methods
  const moveMedication = (medicationId: string, direction: 'up' | 'down', isHome: boolean) => {
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    const currentIndex = targetMeds.findIndex(med => med.id === medicationId);
    
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < targetMeds.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      const reorderedMeds = arrayMove([...targetMeds], currentIndex, newIndex);
      onMedicationsChange({
        ...medications,
        [isHome ? 'homeMedications' : 'hospitalMedications']: reorderedMeds
      });
    }
  };

  const moveToPosition = (medicationId: string, newPosition: number, isHome: boolean) => {
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    const currentIndex = targetMeds.findIndex(med => med.id === medicationId);
    
    if (currentIndex === -1) return;
    
    // Convert 1-based position to 0-based index
    const newIndex = Math.max(0, Math.min(targetMeds.length - 1, newPosition - 1));
    
    if (newIndex !== currentIndex) {
      const reorderedMeds = arrayMove([...targetMeds], currentIndex, newIndex);
      onMedicationsChange({
        ...medications,
        [isHome ? 'homeMedications' : 'hospitalMedications']: reorderedMeds
      });
    }
  };

  const sortMedications = (isHome: boolean, sortBy: 'alphabetical' | 'category' | 'importance' | 'reset') => {
    const targetMeds = isHome ? medications.homeMedications : medications.hospitalMedications;
    let sortedMeds = [...targetMeds];
    
    switch (sortBy) {
      case 'alphabetical':
        sortedMeds.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        sortedMeds.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
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
      homeMedications: isHome ? updatedMeds : otherMeds,
      hospitalMedications: isHome ? otherMeds : updatedMeds
    });
  };

  const medicationCount = medications.homeMedications.length + medications.hospitalMedications.length;

  const renderMedicationList = (meds: SelectedMedication[], isHome: boolean) => {
    if (meds.length === 0) return null;

    return (
      <div className="space-y-2 mt-2">
        {meds.map((med, index) => {
          const commonDosages = medicationDosages[med.name] || [];
          
          return (
            <SortableMedicationItem
              key={med.id}
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
              onToggleDiscontinued={(medicationId) => toggleMedicationDiscontinued(medicationId, isHome)}
              onMoveUp={() => moveMedication(med.id, 'up', isHome)}
              onMoveDown={() => moveMedication(med.id, 'down', isHome)}
              onMoveToPosition={(position) => moveToPosition(med.id, position, isHome)}
              availableDosages={commonDosages}
              language={language}
              position={index + 1}
              totalItems={meds.length}
              canMoveUp={index > 0}
              canMoveDown={index < meds.length - 1}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card className="overflow-visible">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Pill className="text-white w-5 h-5" />
            <h3 className="text-lg font-semibold text-white">
              {language === 'fr' ? 'Médicaments' : 'Medications'}
            </h3>
            {medicationCount > 0 && (
              <span className="text-white/80 text-sm">
                ({medicationCount})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onMedicationsChange({ homeMedications: [], hospitalMedications: [] });
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {language === 'fr' ? 'Effacer' : 'Clear'}
            </button>
          </div>
        </div>
      </div>
      <CardContent className="p-4 h-[calc(100vh-280px)] overflow-y-auto overflow-x-visible">
        {/* Medication Image Upload */}
        <div className="mb-6">
          <MedicationImageUpload onMedicationsExtracted={handleExtractedMedications} />
        </div>
        {/* Side by side layout for home and hospital medications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home Medications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {language === 'fr' ? 'Médicaments à domicile' : 'Home Medications'}
              </h4>
            </div>
            <MedicationAutoComplete
              onMedicationAdd={handleHomeMedicationAdd}
              selectedMedications={getHomeMedicationNames()}
              onMedicationRemove={handleHomeMedicationRemove}
              placeholder={language === 'fr' ? 'Rechercher des médicaments à domicile...' : 'Search home medications...'}
            />
            {renderMedicationList(medications.homeMedications, true)}
          </div>
          {/* Hospital Medications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hospital className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {language === 'fr' ? 'Médicaments hospitaliers' : 'Hospital Medications'}
              </h4>
            </div>
            <MedicationAutoComplete
              onMedicationAdd={handleHospitalMedicationAdd}
              selectedMedications={getHospitalMedicationNames()}
              onMedicationRemove={handleHospitalMedicationRemove}
              placeholder={language === 'fr' ? 'Rechercher des médicaments hospitaliers...' : 'Search hospital medications...'}
            />
            {renderMedicationList(medications.hospitalMedications, false)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}