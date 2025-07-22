import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Cigarette, Wine, Pill, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SocialHistoryData {
  smoking: {
    status: boolean;
    details: string;
  };
  alcohol: {
    status: boolean;
    details: string;
  };
  drugs: {
    status: boolean;
    details: string;
  };
}

interface SocialHistorySectionProps {
  socialHistory: SocialHistoryData;
  onSocialHistoryChange: (socialHistory: SocialHistoryData) => void;
  onConfirm?: () => void;
}

const SocialHistoryItem = ({ 
  category, 
  icon: Icon, 
  title,
  localData,
  setLocalData,
  language
}: {
  category: 'smoking' | 'alcohol' | 'drugs';
  icon: any;
  title: string;
  localData: SocialHistoryData;
  setLocalData: React.Dispatch<React.SetStateAction<SocialHistoryData>>;
  language: string;
}) => {
  const isActive = localData[category].status;
  const hasDetails = localData[category].details.trim().length > 0;
  
  const updateStatus = (newStatus: boolean) => {
    setLocalData(prev => ({
      ...prev,
      [category]: { ...prev[category], status: newStatus }
    }));
  };

  const updateDetails = (details: string) => {
    setLocalData(prev => ({
      ...prev,
      [category]: { ...prev[category], details }
    }));
  };
  
  return (
    <div className={`p-3 rounded-lg border-2 transition-all ${
      isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">{title}</h4>
            {hasDetails && (
              <Badge variant="secondary" className="mt-0.5 text-xs">
                {language === 'fr' ? 'Détails ajoutés' : 'Details added'}
              </Badge>
            )}
          </div>
        </div>
        
        <button
          onClick={() => updateStatus(!isActive)}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isActive ? 'bg-blue-500 focus:ring-blue-500' : 'bg-gray-300 focus:ring-gray-500'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {isActive && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Textarea
              placeholder={language === 'fr' ? `Détails ${title.toLowerCase()}...` : `${title} details...`}
              value={localData[category].details}
              onChange={(e) => updateDetails(e.target.value)}
              className="min-h-[40px] text-sm"
              rows={1}
            />
          </div>
        </div>
      )}

      {!isActive && (
        <div className="text-center py-1">
          <p className="text-xs text-gray-500">
            {language === 'fr' ? `Pas de ${title.toLowerCase()}` : `No ${title.toLowerCase()}`}
          </p>
        </div>
      )}
    </div>
  );
};

export function SocialHistorySection({ socialHistory, onSocialHistoryChange, onConfirm }: SocialHistorySectionProps) {
  const [localData, setLocalData] = useState<SocialHistoryData>(socialHistory);
  const { language } = useLanguage();

  useEffect(() => {
    setLocalData(socialHistory);
  }, [socialHistory]);

  const getStatusCount = () => {
    return [localData.smoking.status, localData.alcohol.status, localData.drugs.status]
      .filter(Boolean).length;
  };

  const handleConfirm = () => {
    onSocialHistoryChange(localData);
    setTimeout(() => {
      onConfirm?.();
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-pink-100 rounded-full">
            <Users className="w-4 h-4 text-pink-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              {language === 'fr' ? 'Histoire Sociale' : 'Social History'}
            </h3>
            <p className="text-xs text-gray-600">
              {language === 'fr' ? 'Habitudes et facteurs sociaux' : 'Lifestyle and social factors'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getStatusCount()}/3 {language === 'fr' ? 'actifs' : 'active'}
          </Badge>
        </div>
      </div>

      {/* Social History Items - Stacked vertically */}
      <div className="grid grid-cols-1 gap-3">
        <SocialHistoryItem
          category="smoking"
          icon={Cigarette}
          title={language === 'fr' ? 'Tabagisme' : 'Smoking'}
          localData={localData}
          setLocalData={setLocalData}
          language={language}
        />
        
        <SocialHistoryItem
          category="alcohol"
          icon={Wine}
          title={language === 'fr' ? 'Alcool' : 'Alcohol'}
          localData={localData}
          setLocalData={setLocalData}
          language={language}
        />
        
        <SocialHistoryItem
          category="drugs"
          icon={Pill}
          title={language === 'fr' ? 'Drogues' : 'Drugs'}
          localData={localData}
          setLocalData={setLocalData}
          language={language}
        />
      </div>

      {/* Summary */}
      {getStatusCount() > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm text-blue-900 mb-1">
                {language === 'fr' ? "Résumé de l'Histoire Sociale" : 'Social History Summary'}
              </h4>
              <div className="space-y-0.5 text-xs text-blue-800">
                {localData.smoking.status && (
                  <p>• {language === 'fr' ? 'Tabagisme:' : 'Smoking:'} {localData.smoking.details || (language === 'fr' ? 'Oui' : 'Yes')}</p>
                )}
                {localData.alcohol.status && (
                  <p>• {language === 'fr' ? 'Alcool:' : 'Alcohol:'} {localData.alcohol.details || (language === 'fr' ? 'Oui' : 'Yes')}</p>
                )}
                {localData.drugs.status && (
                  <p>• {language === 'fr' ? 'Drogues:' : 'Drugs:'} {localData.drugs.details || (language === 'fr' ? 'Oui' : 'Yes')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {onConfirm && (
        <Button
          onClick={handleConfirm}
          className="w-full bg-pink-500 hover:bg-pink-600"
        >
          {language === 'fr' ? "Confirmer l'Histoire Sociale" : 'Confirm Social History'}
        </Button>
      )}
    </div>
  );
}