import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Cigarette, Wine, Pill2, Calendar, Info } from 'lucide-react';
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

const smokingTemplates = [
  '1 pack per day for 20 years',
  '½ pack per day for 10 years', 
  'Quit 5 years ago',
  'Social smoker',
  'Vaping only'
];

const alcoholTemplates = [
  '1-2 drinks per week',
  '1 drink per day',
  '2-3 drinks per day',
  'Weekend drinking only',
  'Quit 2 years ago'
];

const drugTemplates = [
  'Marijuana occasionally',
  'Previous cocaine use',
  'No illicit drugs',
  'Prescription drug misuse',
  'In recovery program'
];

export function SocialHistorySection({ socialHistory, onSocialHistoryChange, onConfirm }: SocialHistorySectionProps) {
  const [localDetails, setLocalDetails] = useState({
    smoking: socialHistory.smoking.details,
    alcohol: socialHistory.alcohol.details,
    drugs: socialHistory.drugs.details
  });
  const { language } = useLanguage();

  useEffect(() => {
    setLocalDetails({
      smoking: socialHistory.smoking.details,
      alcohol: socialHistory.alcohol.details,
      drugs: socialHistory.drugs.details
    });
  }, [socialHistory]);

  const updateStatus = (category: 'smoking' | 'alcohol' | 'drugs', status: boolean) => {
    onSocialHistoryChange({
      ...socialHistory,
      [category]: { status, details: status ? localDetails[category] : '' }
    });
    if (!status) setLocalDetails(prev => ({ ...prev, [category]: '' }));
  };

  const updateDetails = (category: 'smoking' | 'alcohol' | 'drugs', details: string) => {
    setLocalDetails(prev => ({ ...prev, [category]: details }));
  };

  const confirmDetails = (category: 'smoking' | 'alcohol' | 'drugs') => {
    onSocialHistoryChange({
      ...socialHistory,
      [category]: { ...socialHistory[category], details: localDetails[category] }
    });
  };

  const useTemplate = (category: 'smoking' | 'alcohol' | 'drugs', template: string) => {
    setLocalDetails(prev => ({ ...prev, [category]: template }));
    onSocialHistoryChange({
      ...socialHistory,
      [category]: { status: true, details: template }
    });
  };

  const getStatusCount = () => {
    return [socialHistory.smoking.status, socialHistory.alcohol.status, socialHistory.drugs.status]
      .filter(Boolean).length;
  };

  const SocialHistoryItem = ({ 
    category, 
    icon: Icon, 
    title, 
    color, 
    templates 
  }: {
    category: 'smoking' | 'alcohol' | 'drugs';
    icon: any;
    title: string;
    color: string;
    templates: string[];
  }) => {
    const isActive = socialHistory[category].status;
    const hasDetails = socialHistory[category].details.trim().length > 0;
    
    return (
      <div className={`p-4 rounded-lg border-2 transition-all ${
        isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              {hasDetails && (
                <Badge variant="secondary" className="mt-1">
                  {language === 'fr' ? 'Détails ajoutés' : 'Details added'}
                </Badge>
              )}
            </div>
          </div>
          
          <button
            onClick={() => updateStatus(category, !isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isActive ? 'bg-blue-500 focus:ring-blue-500' : 'bg-gray-300 focus:ring-gray-500'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isActive && (
          <div className="space-y-3">
            {/* Quick Templates */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {language === 'fr' ? 'Modèles rapides:' : 'Quick templates:'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {templates.slice(0, 3).map((template, index) => (
                  <button
                    key={index}
                    onClick={() => useTemplate(category, template)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      localDetails[category] === template
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <Textarea
                placeholder={language === 'fr' ? `Détails ${title.toLowerCase()}...` : `${title} details...`}
                defaultValue={localDetails[category]}
                onBlur={(e) => {
                  updateDetails(category, e.target.value);
                  confirmDetails(category);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const value = (e.target as HTMLTextAreaElement).value;
                    updateDetails(category, value);
                    confirmDetails(category);
                  }
                }}
                className="min-h-[60px] text-sm"
                rows={2}
              />

            </div>
          </div>
        )}

        {!isActive && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">
              {language === 'fr' ? `Pas de ${title.toLowerCase()}` : `No ${title.toLowerCase()}`}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-full">
            <Users className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {language === 'fr' ? 'Histoire Sociale' : 'Social History'}
            </h3>
            <p className="text-sm text-gray-600">
              {language === 'fr' ? 'Habitudes et facteurs sociaux' : 'Lifestyle and social factors'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {getStatusCount()}/3 {language === 'fr' ? 'actifs' : 'active'}
          </Badge>
        </div>
      </div>

      {/* Social History Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SocialHistoryItem
          category="smoking"
          icon={Cigarette}
          title={language === 'fr' ? 'Tabagisme' : 'Smoking'}
          color="red"
          templates={smokingTemplates}
        />
        
        <SocialHistoryItem
          category="alcohol"
          icon={Wine}
          title={language === 'fr' ? 'Alcool' : 'Alcohol'}
          color="amber"
          templates={alcoholTemplates}
        />
        
        <SocialHistoryItem
          category="drugs"
          icon={Pill2}
          title={language === 'fr' ? 'Drogues' : 'Drugs'}
          color="purple"
          templates={drugTemplates}
        />
      </div>

      {/* Summary */}
      {getStatusCount() > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">
                {language === 'fr' ? 'Résumé de l\'Histoire Sociale' : 'Social History Summary'}
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                {socialHistory.smoking.status && (
                  <p>• {language === 'fr' ? 'Tabagisme:' : 'Smoking:'} {socialHistory.smoking.details || (language === 'fr' ? 'Oui' : 'Yes')}</p>
                )}
                {socialHistory.alcohol.status && (
                  <p>• {language === 'fr' ? 'Alcool:' : 'Alcohol:'} {socialHistory.alcohol.details || (language === 'fr' ? 'Oui' : 'Yes')}</p>
                )}
                {socialHistory.drugs.status && (
                  <p>• {language === 'fr' ? 'Drogues:' : 'Drugs:'} {socialHistory.drugs.details || (language === 'fr' ? 'Oui' : 'Yes')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {onConfirm && (
        <Button
          onClick={onConfirm}
          className="w-full bg-pink-500 hover:bg-pink-600"
        >
          {language === 'fr' ? 'Confirmer l\'Histoire Sociale' : 'Confirm Social History'}
        </Button>
      )}
    </div>
  );
}