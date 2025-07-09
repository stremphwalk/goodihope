import React, { useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FlaskConical, 
  Settings,
  Check,
  Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LabValue, ProcessedLabValue } from '@/lib/labUtils';

import { EnhancedLabEntry } from './EnhancedLabEntry';

interface ImprovedLabInterfaceProps {
  processedLabs: ProcessedLabValue[];
  onLabsChange: (labs: ProcessedLabValue[]) => void;
  onLabAdd: (labValues: LabValue[]) => void;
  selectedLabs: string[];
  onLabRemove: (testName: string) => void;
  onLabValuesExtracted?: (labValues: LabValue[]) => void;
  selectedPanel: string;
  setSelectedPanel: (panel: string) => void;
}

export function ImprovedLabInterface({ 
  processedLabs, 
  onLabsChange, 
  onLabAdd, 
  selectedLabs, 
  onLabRemove,
  onLabValuesExtracted,
  selectedPanel,
  setSelectedPanel
}: ImprovedLabInterfaceProps) {
  const { language } = useLanguage();
  const [pendingLabEntries, setPendingLabEntries] = useState<Record<string, string[]>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const handleLabAdd = useCallback((labValues: LabValue[]) => {
    onLabAdd(labValues);
  }, [onLabAdd]);

  // Calculate total pending entries across all panels
  const totalPendingEntries = useMemo(() => {
    return Object.values(pendingLabEntries).reduce((total, entries) => total + entries.length, 0);
  }, [pendingLabEntries]);

  // Get all lab test definitions for confirmation logic
  const LAB_GROUPS = useMemo(() => [
    {
      name: 'Basic Metabolic Panel',
      panelId: 'bmp',
      tests: [
        { id: 'sodium', name: 'Na', unit: 'mmol/L', category: 'BMP', referenceRange: '136-145' },
        { id: 'potassium', name: 'K', unit: 'mmol/L', category: 'BMP', referenceRange: '3.5-5.1' },
        { id: 'chloride', name: 'Cl', unit: 'mmol/L', category: 'BMP', referenceRange: '98-107' },
        { id: 'co2', name: 'CO2', unit: 'mmol/L', category: 'BMP', referenceRange: '22-28' },
        { id: 'bun', name: 'BUN', unit: 'mmol/L', category: 'BMP', referenceRange: '2.5-7.1' },
        { id: 'creatinine', name: 'Creat', unit: 'μmol/L', category: 'BMP', referenceRange: '53-106' },
        { id: 'glucose', name: 'Glucose', unit: 'mmol/L', category: 'BMP', referenceRange: '3.9-5.6' },
        { id: 'egfr', name: 'eGFR', unit: 'mL/min/1.73m²', category: 'BMP', referenceRange: '>60' },
      ]
    },
    {
      name: 'CBC with Differential',
      panelId: 'cbc',
      tests: [
        { id: 'hb', name: 'Hb', unit: 'g/L', category: 'CBC', referenceRange: '120-160' },
        { id: 'hct', name: 'Hct', unit: 'L/L', category: 'CBC', referenceRange: '0.36-0.46' },
        { id: 'wbc', name: 'WBC', unit: '×10⁹/L', category: 'CBC', referenceRange: '4.5-11.0' },
        { id: 'rbc', name: 'RBC', unit: '×10¹²/L', category: 'CBC', referenceRange: '4.2-5.4' },
        { id: 'plt', name: 'Plt', unit: '×10⁹/L', category: 'CBC', referenceRange: '150-450' },
        { id: 'mcv', name: 'MCV', unit: 'fL', category: 'CBC', referenceRange: '80-100' },
        { id: 'mch', name: 'MCH', unit: 'pg', category: 'CBC', referenceRange: '27-31' },
        { id: 'mchc', name: 'MCHC', unit: 'g/L', category: 'CBC', referenceRange: '320-360' },
        { id: 'rdw', name: 'RDW', unit: '%', category: 'CBC', referenceRange: '11.5-14.5' },
        { id: 'neutrophils', name: 'Neutrophils', unit: '%', category: 'CBC', referenceRange: '50-70' },
        { id: 'lymphocytes', name: 'Lymphocytes', unit: '%', category: 'CBC', referenceRange: '20-40' },
        { id: 'monocytes', name: 'Monocytes', unit: '%', category: 'CBC', referenceRange: '2-8' },
      ]
    },
    {
      name: 'Liver Function Tests',
      panelId: 'lft',
      tests: [
        { id: 'alt', name: 'ALT', unit: 'U/L', category: 'LFT', referenceRange: '7-56' },
        { id: 'ast', name: 'AST', unit: 'U/L', category: 'LFT', referenceRange: '10-40' },
        { id: 'alp', name: 'ALP', unit: 'U/L', category: 'LFT', referenceRange: '44-147' },
        { id: 'bilirubin_total', name: 'Total Bili', unit: 'μmol/L', category: 'LFT', referenceRange: '5-21' },
        { id: 'bilirubin_direct', name: 'Direct Bili', unit: 'μmol/L', category: 'LFT', referenceRange: '0-5' },
        { id: 'albumin', name: 'Albumin', unit: 'g/L', category: 'LFT', referenceRange: '35-50' },
        { id: 'total_protein', name: 'Total Protein', unit: 'g/L', category: 'LFT', referenceRange: '60-83' },
        { id: 'ggt', name: 'GGT', unit: 'U/L', category: 'LFT', referenceRange: '9-48' },
      ]
    },
    {
      name: 'Lipid Panel',
      panelId: 'lipids',
      tests: [
        { id: 'cholesterol_total', name: 'Total Chol', unit: 'mmol/L', category: 'Lipids', referenceRange: '<5.2' },
        { id: 'hdl', name: 'HDL', unit: 'mmol/L', category: 'Lipids', referenceRange: '>1.0' },
        { id: 'ldl', name: 'LDL', unit: 'mmol/L', category: 'Lipids', referenceRange: '<2.6' },
        { id: 'triglycerides', name: 'Triglycerides', unit: 'mmol/L', category: 'Lipids', referenceRange: '<1.7' },
        { id: 'non_hdl', name: 'Non-HDL', unit: 'mmol/L', category: 'Lipids', referenceRange: '<3.4' },
      ]
    },
    {
      name: 'Thyroid Panel',
      panelId: 'thyroid',
      tests: [
        { id: 'tsh', name: 'TSH', unit: 'mU/L', category: 'Thyroid', referenceRange: '0.4-4.0' },
        { id: 't4_free', name: 'Free T4', unit: 'pmol/L', category: 'Thyroid', referenceRange: '10-23' },
        { id: 't3_free', name: 'Free T3', unit: 'pmol/L', category: 'Thyroid', referenceRange: '3.5-6.5' },
        { id: 't3_total', name: 'Total T3', unit: 'nmol/L', category: 'Thyroid', referenceRange: '1.2-3.1' },
      ]
    },
    {
      name: 'Cardiac Markers',
      panelId: 'cardiac',
      tests: [
        { id: 'troponin_i', name: 'Troponin I', unit: 'ng/mL', category: 'Cardiac', referenceRange: '<0.04' },
        { id: 'troponin_t', name: 'Troponin T', unit: 'ng/mL', category: 'Cardiac', referenceRange: '<0.01' },
        { id: 'ck_mb', name: 'CK-MB', unit: 'ng/mL', category: 'Cardiac', referenceRange: '<6.3' },
        { id: 'bnp', name: 'BNP', unit: 'pg/mL', category: 'Cardiac', referenceRange: '<100' },
        { id: 'nt_probnp', name: 'NT-proBNP', unit: 'pg/mL', category: 'Cardiac', referenceRange: '<125' },
      ]
    },
    {
      name: 'Inflammatory Markers',
      panelId: 'inflammatory',
      tests: [
        { id: 'esr', name: 'ESR', unit: 'mm/hr', category: 'Inflammatory', referenceRange: '<30' },
        { id: 'crp', name: 'CRP', unit: 'mg/L', category: 'Inflammatory', referenceRange: '<3.0' },
        { id: 'procalcitonin', name: 'Procalcitonin', unit: 'ng/mL', category: 'Inflammatory', referenceRange: '<0.25' },
        { id: 'ferritin', name: 'Ferritin', unit: 'ng/mL', category: 'Inflammatory', referenceRange: '15-150' },
      ]
    },
    {
      name: 'Diabetic Panel',
      panelId: 'diabetic',
      tests: [
        { id: 'glucose_fasting', name: 'Fasting Glucose', unit: 'mmol/L', category: 'Diabetic', referenceRange: '3.9-5.6' },
        { id: 'hba1c', name: 'HbA1c', unit: '%', category: 'Diabetic', referenceRange: '<5.7' },
        { id: 'glucose_random', name: 'Random Glucose', unit: 'mmol/L', category: 'Diabetic', referenceRange: '<7.8' },
        { id: 'fructosamine', name: 'Fructosamine', unit: 'μmol/L', category: 'Diabetic', referenceRange: '205-285' },
      ]
    },
    {
      name: 'Coagulation Studies',
      panelId: 'coagulation',
      tests: [
        { id: 'pt', name: 'PT', unit: 'sec', category: 'Coagulation', referenceRange: '11-13' },
        { id: 'ptt', name: 'PTT', unit: 'sec', category: 'Coagulation', referenceRange: '25-35' },
        { id: 'inr', name: 'INR', unit: '', category: 'Coagulation', referenceRange: '0.8-1.1' },
        { id: 'fibrinogen', name: 'Fibrinogen', unit: 'g/L', category: 'Coagulation', referenceRange: '2.0-4.0' },
        { id: 'd_dimer', name: 'D-Dimer', unit: 'μg/L', category: 'Coagulation', referenceRange: '<500' },
      ]
    }
  ], []);

  // Function to confirm all pending entries across all panels
  const confirmAllPendingEntries = useCallback(async () => {
    if (totalPendingEntries === 0) return;
    setIsConfirming(true);
    try {
      const allConfirmedEntries: LabValue[] = [];
      const allTests = LAB_GROUPS.flatMap(g => g.tests);
      // Process all pending entries
      Object.entries(pendingLabEntries).forEach(([testId, values]) => {
        if (values.length === 0) return;
        if (testId.startsWith('custom:')) {
          // Handle custom labs
          const customName = testId.replace('custom:', '');
          values.forEach((value, index) => {
            const timestamp = new Date(Date.now() - index * 60000).toISOString();
            allConfirmedEntries.push({
              testName: customName,
              value: value.trim(),
              unit: '', // Could be extended to support units
              category: 'Custom',
              timestamp,
              referenceRange: '',
            });
          });
          return;
        }
        // Standard labs
        const test = allTests.find(t => t.id === testId);
        if (!test) {
          console.warn(`Test definition not found for testId: ${testId}`);
          return;
        }
        // Filter out empty or invalid values
        const validValues = values.filter(value => {
          const trimmed = value.trim();
          return trimmed.length > 0;
        });
        if (validValues.length === 0) return;
        // If there are multiple values, create them with proper timestamps for trending
        const confirmedEntries = validValues.map((value, index) => {
          // Create timestamps in chronological order (first entered = most recent, last entered = oldest)
          // This ensures the first entered value becomes the main value, subsequent values become trending
          const timestamp = new Date(Date.now() - index * 60000).toISOString();
          return {
            testName: test.name,
            value: value.trim(),
            unit: test.unit,
            category: test.category,
            timestamp: timestamp,
            referenceRange: test.referenceRange,
          };
        });
        allConfirmedEntries.push(...confirmedEntries);
      });
      // Add all confirmed entries at once
      if (allConfirmedEntries.length > 0) {
        try {
          handleLabAdd(allConfirmedEntries);
        } catch (error) {
          console.error('Error adding lab entries:', error);
          // Don't clear pending entries if adding failed
          setIsConfirming(false);
          return;
        }
        // Clear all pending entries only after successful addition
        setPendingLabEntries({});
      }
    } catch (error) {
      console.error('Error in confirmAllPendingEntries:', error);
    } finally {
      setIsConfirming(false);
    }
  }, [pendingLabEntries, totalPendingEntries, LAB_GROUPS, handleLabAdd]);

  const totalLabsEntered = processedLabs.length;
  const visibleLabs = processedLabs.filter(lab => lab.showInNote).length;
  const abnormalCount = processedLabs.filter(lab => {
    // Simple heuristic for abnormal values - could be enhanced with actual reference ranges
    const value = parseFloat(lab.mostRecent.value);
    return !isNaN(value) && (value === 0 || lab.mostRecent.value.includes('H') || lab.mostRecent.value.includes('L'));
  }).length;

  return (
    <div className="space-y-8">
      {/* Header with stats */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <FlaskConical className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {language === 'fr' ? 'Interface Laboratoire' : 'Laboratory Interface'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {language === 'fr' ? 'Gestion complète des valeurs de laboratoire' : 'Complete lab values management'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-2 px-3 py-1.5">
                <span className="font-semibold">{totalLabsEntered}</span>
                <span className="text-xs">{language === 'fr' ? 'total' : 'total'}</span>
              </Badge>
              
              <Badge variant="outline" className="flex items-center space-x-2 px-3 py-1.5 border-green-300 text-green-700 dark:border-green-600 dark:text-green-400">
                <span className="font-semibold">{visibleLabs}</span>
                <span className="text-xs">{language === 'fr' ? 'visibles' : 'visible'}</span>
              </Badge>
              
              {abnormalCount > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-2 px-3 py-1.5">
                  <span className="font-semibold">{abnormalCount}</span>
                  <span className="text-xs">{language === 'fr' ? 'anormaux' : 'abnormal'}</span>
                </Badge>
              )}

              {totalPendingEntries > 0 && (
                <Badge variant="outline" className="flex items-center space-x-2 px-3 py-1.5 border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  <span className="font-semibold">{totalPendingEntries}</span>
                  <span className="text-xs">{language === 'fr' ? 'en attente' : 'pending'}</span>
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {totalPendingEntries > 0 && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={confirmAllPendingEntries}
                  disabled={isConfirming}
                  className="px-3 py-2 h-auto bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isConfirming 
                    ? (language === 'fr' ? 'Confirmation...' : 'Confirming...')
                    : (language === 'fr' ? 'Confirmer Tout' : 'Confirm All')
                  }
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="px-3 py-2 h-auto">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Quick entry is now always open */}
      <div className="w-full">
        <EnhancedLabEntry 
          onLabAdd={handleLabAdd}
          selectedLabs={selectedLabs}
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
          pendingLabEntries={pendingLabEntries}
          setPendingLabEntries={setPendingLabEntries}
          confirmAllPendingEntries={confirmAllPendingEntries}
          isConfirming={isConfirming}
          totalPendingEntries={totalPendingEntries}
        />
      </div>
    </div>
  );
}