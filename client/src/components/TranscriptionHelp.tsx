// @ts-nocheck
/**
 * TranscriptionHelp Component
 * Provides helpful information about transcription features and setup
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Info, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedicalTranscription } from '@/contexts/MedicalTranscriptionContext';

interface TranscriptionHelpProps {
  showByDefault?: boolean;
  onClose?: () => void;
}

export function TranscriptionHelp({ showByDefault = false, onClose }: TranscriptionHelpProps) {
  const [isVisible, setIsVisible] = useState(showByDefault);
  const { language } = useLanguage();
  const { isGloballyEnabled } = useMedicalTranscription();

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !isGloballyEnabled) {
    return null;
  }

  const content = language === 'fr' ? {
    title: '🎤 Transcription Vocale Activée',
    subtitle: 'IA médicale optimisée pour la documentation clinique',
    steps: [
      'Cliquez sur l\'icône 🎤 microphone dans les zones de texte',
      'Parlez clairement en utilisant la terminologie médicale',
      'Le système reconnaît automatiquement le français médical',
      'Appuyez sur Espace pour arrêter l\'enregistrement'
    ],
    troubleshoot: 'Problèmes d\'accès au microphone ?',
    troubleshootSteps: [
      'Cliquez sur l\'icône 🔒 dans la barre d\'adresse',
      'Réglez "Microphone" sur "Autoriser"',
      'Actualisez la page et réessayez'
    ],
    benefits: [
      'Transcription en temps réel optimisée pour la médecine',
      'Reconnaissance de la terminologie française et anglaise',
      'Insertion automatique avec correction intelligente',
      'Compatible avec tous les navigateurs modernes'
    ],
    close: 'Compris'
  } : {
    title: '🎤 Voice Transcription Enabled',
    subtitle: 'Medical AI optimized for clinical documentation',
    steps: [
      'Click the 🎤 microphone icon in text areas',
      'Speak clearly using medical terminology',
      'System automatically recognizes medical English',
      'Press Space to stop recording'
    ],
    troubleshoot: 'Microphone access issues?',
    troubleshootSteps: [
      'Click the 🔒 lock icon in your address bar',
      'Set "Microphone" to "Allow"',
      'Refresh the page and try again'
    ],
    benefits: [
      'Real-time transcription optimized for medicine',
      'Recognizes English and French medical terminology',
      'Auto-insertion with intelligent correction',
      'Compatible with all modern browsers'
    ],
    close: 'Got it'
  };

  return (
    <Card className="mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-blue-100 rounded-full">
                <Mic className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">{content.title}</h3>
                <p className="text-xs text-blue-700">{content.subtitle}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-3">
              {/* How to Use */}
              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  {language === 'fr' ? 'Comment utiliser' : 'How to Use'}
                </h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  {content.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Troubleshooting */}
              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-orange-600" />
                  {content.troubleshoot}
                </h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  {content.troubleshootSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-orange-100 text-orange-600 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-3 p-2 bg-white/60 rounded border border-blue-200">
              <h5 className="font-medium text-xs text-gray-800 mb-1">
                ✨ {language === 'fr' ? 'Avantages' : 'Benefits'}
              </h5>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {content.benefits.map((benefit, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="ml-2 h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Info className="w-3 h-3" />
            {language === 'fr' 
              ? 'Transcription sécurisée avec IA médicale avancée'
              : 'Secure transcription with advanced medical AI'
            }
          </div>
          
          <Button
            onClick={handleClose}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white h-6 px-3 text-xs"
          >
            {content.close}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TranscriptionHelp;