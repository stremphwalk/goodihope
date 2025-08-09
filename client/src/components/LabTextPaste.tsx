import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Loader2, CheckCircle, X, Clipboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { LabValue } from '@/lib/labUtils';
import { parseLabText } from '@/lib/labTextParser';

interface LabTextPasteProps {
  onLabValuesExtracted: (labValues: LabValue[]) => void;
}

export function LabTextPaste({ onLabValuesExtracted }: LabTextPasteProps) {
  const [labText, setLabText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  const sampleText = `HB: 68(63 67 68 71 74) GB: <0.1(<0.1 <0.1 <0.1 0.3 0.7) PLT: 38(31 29 24 11 18) VGM: 93.1(93.0 93.9 94.0 94.6) NEUT: 0.00(0.00 0.01 0.00 0.10 0.21) LYMP: 0.02(0.00 0.06 0.00 0.02) RNI: 1.10(1.02 1.01 1.00) TTPA: 20.6(<19.0 <19.0 19.1 26.3) CRP: 53.5(37.0) TROT: 32(31) NT-proBNP: 786 Créat: 90(98 87 97 100) CK: 1391(1679 1748 1583) DFG ca: 80(72 83 73 70) Urée: 20.3(14.4 15.6 16.1) NA: 151(153 154 157) K: 3.1(3.4 3.6 3.6) Mg: 1.03(1.05 1.10 1.09) Cl: 113(116 117 115) PHOSP: 0.52(0.59 0.73 0.59) Ca: 2.01(2.01 2.04 2.00) Gluc: 10.0(10.4 11.0 10.9) ALT: 92(127 133 117) BILIT: 56.4(57.9 67.0 68.8) LDH: 734(726 907 977) GGT: 68(75 78 42) P alc: 47(47 49 53) Alb: 24.1(24.2 24.8 24.9)`;

  // Memoize the process text function to prevent unnecessary re-renders
  const handleProcessText = useCallback(async () => {
    if (!labText.trim()) {
      toast({
        title: language === 'fr' ? 'Texte requis' : 'Text Required',
        description: language === 'fr' 
          ? 'Veuillez coller ou saisir du texte de laboratoire'
          : 'Please paste or enter lab text',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setExtractedCount(null);

    try {
      // Parse the lab text using our parser
      const labValues = parseLabText(labText);

      if (labValues.length > 0) {
        onLabValuesExtracted(labValues);
        setExtractedCount(labValues.length);
        
        toast({
          title: language === 'fr' ? 'Analyse terminée' : 'Parsing Complete',
          description: language === 'fr' 
            ? `${labValues.length} valeurs de laboratoire extraites`
            : `${labValues.length} lab values extracted`,
        });
      } else {
        toast({
          title: language === 'fr' ? 'Aucune donnée trouvée' : 'No Data Found',
          description: language === 'fr' 
            ? 'Aucune valeur de laboratoire valide trouvée dans le texte'
            : 'No valid lab values found in the text',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error parsing lab text:', error);
      toast({
        title: language === 'fr' ? 'Erreur d\'analyse' : 'Parsing Error',
        description: language === 'fr' 
          ? 'Erreur lors de l\'analyse du texte de laboratoire'
          : 'Error parsing lab text',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [labText, language, toast, onLabValuesExtracted]);

  // We no longer auto-process on Ctrl+V; user must click "Parse Text"

  // Handle paste events directly on the textarea
  const handleTextareaPaste = useCallback((event: React.ClipboardEvent) => {
    const pastedText = event.clipboardData.getData('text');
    if (pastedText.trim()) {
      setLabText(pastedText);
      // No auto-processing; user will click "Parse Text" manually
    }
  }, [handleProcessText]);

  const handlePasteFromClipboard = async () => {
    // Always focus textarea first so the user can still press Ctrl+V if all else fails
    textareaRef.current?.focus();

    // Guard: Clipboard API may be unavailable (e.g., non-secure context, older browser)
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      toast({
        title: language === 'fr' ? 'Presse-papiers non supporté' : 'Clipboard Unavailable',
        description: language === 'fr'
          ? 'Impossible d\'accéder au presse-papiers. Utilisez Ctrl+V.'
          : 'Cannot access clipboard. Please use Ctrl+V to paste.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        setLabText(text);
        toast({
          title: language === 'fr' ? 'Texte collé' : 'Text Pasted',
          description: language === 'fr'
            ? 'Cliquez sur "Analyser le texte" pour le traiter.'
            : 'Click "Parse Text" to process.',
        });
      } else {
        toast({
          title: language === 'fr' ? 'Presse-papiers vide' : 'Clipboard Empty',
          description: language === 'fr'
            ? 'Le presse-papiers ne contient pas de texte.'
            : 'Clipboard does not contain any text.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Clipboard read failed', err);
      toast({
        title: language === 'fr' ? 'Accès refusé' : 'Clipboard Access Denied',
        description: language === 'fr'
          ? 'Impossible de lire le presse-papiers. Autorisez l\'accès ou utilisez Ctrl+V.'
          : 'Unable to read clipboard. Grant permission or use Ctrl+V.',
        variant: 'destructive',
      });
    }
  };

  const handleUseSample = () => {
    setLabText(sampleText);
    toast({
      title: language === 'fr' ? 'Exemple chargé' : 'Sample Loaded',
      description: language === 'fr' 
        ? 'Les données d\'exemple ont été chargées'
        : 'Sample data has been loaded',
    });
  };

  const handleClear = () => {
    setLabText('');
    setExtractedCount(null);
    textareaRef.current?.focus();
  };

  // Focus the textarea when component mounts for better UX
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <Card className="mb-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h4 className="font-medium text-slate-800 dark:text-slate-100">
              {language === 'fr' ? 'Coller le texte des laboratoires' : 'Paste Lab Text'}
            </h4>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={
                  language === 'fr' 
                    ? 'Collez votre texte de laboratoire ici (Ctrl+V pour coller et analyser automatiquement)...\n\nFormat attendu:\nHB: 68(63 67 68) GB: <0.1(<0.1 <0.1) PLT: 38(31 29)...'
                    : 'Paste your lab text here (Ctrl+V to paste and auto-process)...\n\nExpected format:\nHB: 68(63 67 68) GB: <0.1(<0.1 <0.1) PLT: 38(31 29)...'
                }
                value={labText}
                onChange={(e) => setLabText(e.target.value)}
                onPaste={handleTextareaPaste}
                className="min-h-32 font-mono text-sm resize-y border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                disabled={isProcessing}
              />
              {labText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handlePasteFromClipboard}
                disabled={isProcessing}
                size="sm"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                {language === 'fr' ? 'Coller' : 'Paste'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleUseSample}
                disabled={isProcessing}
                size="sm"
              >
                <FileText className="mr-2 h-4 w-4" />
                {language === 'fr' ? 'Utiliser l\'exemple' : 'Use Sample'}
              </Button>

              <Button
                onClick={handleProcessText}
                disabled={isProcessing || !labText.trim()}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'fr' ? 'Analyse...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    {language === 'fr' ? 'Analyser le texte' : 'Parse Text'}
                  </>
                )}
              </Button>
            </div>

            {/* Success indicator */}
            {extractedCount !== null && extractedCount > 0 && !isProcessing && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {language === 'fr' 
                      ? `${extractedCount} valeurs de laboratoire extraites avec succès`
                      : `${extractedCount} lab values successfully extracted`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-medium">
                {language === 'fr' ? 'Format attendu:' : 'Expected format:'}
              </p>
              <p>
                {language === 'fr' 
                  ? 'Nom_Labo: Valeur_Principale (Valeur_Historique1, Valeur_Historique2, ...)'
                  : 'Lab_Name: Main_Value (Historical_Value1, Historical_Value2, ...)'}
              </p>
              <p className="italic">
                {language === 'fr' 
                  ? 'Exemple: HB: 68(63 67 68) PLT: 38(31 29 24)'
                  : 'Example: HB: 68(63 67 68) PLT: 38(31 29 24)'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}