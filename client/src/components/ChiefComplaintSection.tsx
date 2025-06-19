import { useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ChiefComplaintData {
  selectedTemplate: string;
  customComplaint: string;
  presentingSymptoms: string;
  onsetDuration: string;
  associatedSymptoms: string;
  aggravatingFactors: string;
  relievingFactors: string;
  previousTreatment: string;
}

interface ChiefComplaintSectionProps {
  data: ChiefComplaintData;
  onChange: (data: ChiefComplaintData) => void;
}

export function ChiefComplaintSection({ data, onChange }: ChiefComplaintSectionProps) {
  const { language } = useLanguage();

  // Use useEffect to set basic template to avoid setState during render
  useEffect(() => {
    if (data.selectedTemplate !== 'basic') {
      onChange({
        ...data,
        selectedTemplate: 'basic'
      });
    }
  }, [data.selectedTemplate, onChange]);

  const handleFieldChange = useCallback((field: keyof ChiefComplaintData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  }, [data, onChange]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Stethoscope className="text-white w-5 h-5" />
          <h3 className="text-lg font-semibold text-white">
            {language === 'fr' ? 'Raison de consultation' : 'Chief Complaint'}
          </h3>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {language === 'fr' ? 'Raison de consultation' : 'Reason for Consultation'}
        </label>
        <Textarea
          placeholder={language === 'fr' ? 'Entrer la raison de consultation...' : 'Enter reason for consultation...'}
          value={data.customComplaint}
          onChange={(e) => handleFieldChange('customComplaint', e.target.value)}
          className="min-h-[100px] text-base"
          autoFocus
        />
      </div>
    </div>
  );
}