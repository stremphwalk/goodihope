import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pill, Loader2, CheckCircle, X, Clipboard, Home, Hospital } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { type SelectedMedication } from '@/lib/medicationUtils';
import { parseMedicationText } from '@/lib/medicationTextParser';

interface MedicationTextPasteProps {
  onMedicationsExtracted: (medications: SelectedMedication[], isInpatient: boolean) => void;
}

export function MedicationTextPaste({ onMedicationsExtracted }: MedicationTextPasteProps) {
  const [medicationText, setMedicationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);
  const [isInpatient, setIsInpatient] = useState(true); // Default to inpatient (hospital)
  const [lastProcessedText, setLastProcessedText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  const sampleText = `25-08-05 1019    Métoprolol [Lopresor]    50 mg co PO deux (2) fois jour planifié par défaut à 0815/2200
25-07-31 0805    Nitroglycérine    1 bouffée(s) sub-ling au besoin si douleurs rétro-sternales
25-07-31 1926    Thiamine [Vitamine B-1]    100 mg IV une fois par jour au déjeuner
25-08-01 1631    Trurapi [Ins.Aspart SANS LATEX] SC selon échelle    EN SC trois (3) fois jour planifié par défaut à 0745/dîner/souper
25-08-03 1245    Metformine [Glucophage]    850 mg PO deux (2) fois jour planifié par défaut à 0745/souper
25-08-02 1112    Amiodarone [Cordarone]    400 mg co PO trois (3) fois jour planifié par défaut à déjeuner/dîner/souper x 6 jours
25-08-02 1214    HYDROmorphone    0,5-1 mg co PO à toutes les 4 heures au besoin
25-08-02 1214    Polyethylene Glycol [MiraLax/Lax-A-Day][PEG 3350]    17 g PO une fois par jour au besoin
25-08-04 1314    Gliclazide [Diamicron]    160 mg co PO une fois par jour planifié par défaut à 0745
25-07-28 1604    Acétaminophène [Tylenol]    1 000 mg co PO à toutes les 6 heures au besoin si douleur et/ou fièvre`;

  // Memoize the process text function to prevent unnecessary re-renders
  const handleProcessText = useCallback(async () => {
    if (!medicationText.trim()) {
      toast({
        title: language === 'fr' ? 'Texte requis' : 'Text Required',
        description: language === 'fr' 
          ? 'Veuillez coller ou saisir du texte de médicaments'
          : 'Please paste or enter medication text',
        variant: 'destructive'
      });
      return;
    }

    // Prevent processing the same text multiple times
    const currentTextKey = `${medicationText.trim()}-${isInpatient}`;
    if (currentTextKey === lastProcessedText) {
      toast({
        title: language === 'fr' ? 'Déjà traité' : 'Already Processed',
        description: language === 'fr' 
          ? 'Ce texte a déjà été analysé avec les mêmes paramètres'
          : 'This text has already been processed with the same settings',
        variant: 'default'
      });
      return;
    }

    setIsProcessing(true);
    setExtractedCount(null);

    try {
      // Parse the medication text using our parser
      const medications = parseMedicationText(medicationText);

      if (medications.length > 0) {
        onMedicationsExtracted(medications, isInpatient);
        setExtractedCount(medications.length);
        setLastProcessedText(currentTextKey);
        
        toast({
          title: language === 'fr' ? 'Analyse terminée' : 'Parsing Complete',
          description: language === 'fr' 
            ? `${medications.length} médicaments extraits`
            : `${medications.length} medications extracted`,
        });
      } else {
        toast({
          title: language === 'fr' ? 'Aucune donnée trouvée' : 'No Data Found',
          description: language === 'fr' 
            ? 'Aucun médicament valide trouvé dans le texte'
            : 'No valid medications found in the text',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error parsing medication text:', error);
      toast({
        title: language === 'fr' ? 'Erreur d\'analyse' : 'Parsing Error',
        description: language === 'fr' 
          ? 'Erreur lors de l\'analyse du texte de médicaments'
          : 'Error parsing medication text',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [medicationText, isInpatient, language, toast, onMedicationsExtracted, lastProcessedText]);

  // Handle paste events directly on the textarea
  const handleTextareaPaste = useCallback((event: React.ClipboardEvent) => {
    const pastedText = event.clipboardData.getData('text');
    if (pastedText.trim()) {
      setMedicationText(pastedText);
      // No auto-processing; user will click "Parse Text" manually
    }
  }, []);

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
        setMedicationText(text);
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
    setMedicationText(sampleText);
    toast({
      title: language === 'fr' ? 'Exemple chargé' : 'Sample Loaded',
      description: language === 'fr' 
        ? 'Les données d\'exemple ont été chargées'
        : 'Sample data has been loaded',
    });
  };

  const handleClear = () => {
    setMedicationText('');
    setExtractedCount(null);
    setLastProcessedText('');
    textareaRef.current?.focus();
  };

  // Focus the textarea when component mounts for better UX
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {language === 'fr' ? 'Coller le texte des médicaments' : 'Paste Medication Text'}
              </h4>
            </div>

            {/* Toggle Switch for Inpatient vs Outpatient */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Home className={`h-4 w-4 ${!isInpatient ? 'text-blue-600' : 'text-gray-400'}`} />
                <Label htmlFor="medication-type-toggle" className="text-sm font-medium">
                  {language === 'fr' ? 'Domicile' : 'Home'}
                </Label>
              </div>
              <Switch
                id="medication-type-toggle"
                checked={isInpatient}
                onCheckedChange={setIsInpatient}
                className="data-[state=checked]:bg-green-600"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="medication-type-toggle" className="text-sm font-medium">
                  {language === 'fr' ? 'Hôpital' : 'Hospital'}
                </Label>
                <Hospital className={`h-4 w-4 ${isInpatient ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={
                  language === 'fr' 
                    ? 'Collez votre liste de médicaments ici...\n\nFormat attendu:\n25-08-05 1019    Métoprolol [Lopresor]    50 mg co PO deux (2) fois jour\n25-07-31 0805    Nitroglycérine    1 bouffée(s) sub-ling au besoin\n...'
                    : 'Paste your medication list here...\n\nExpected format:\n25-08-05 1019    Metoprolol [Lopresor]    50 mg co PO twice daily\n25-07-31 0805    Nitroglycerin    1 puff sub-ling PRN\n...'
                }
                value={medicationText}
                onChange={(e) => {
                  setMedicationText(e.target.value);
                  // Reset processed text tracking when content changes
                  if (e.target.value !== medicationText) {
                    setLastProcessedText('');
                    setExtractedCount(null);
                  }
                }}
                onPaste={handleTextareaPaste}
                className="min-h-32 font-mono text-sm resize-y"
                disabled={isProcessing}
              />
              {medicationText && (
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
                <Pill className="mr-2 h-4 w-4" />
                {language === 'fr' ? 'Utiliser l\'exemple' : 'Use Sample'}
              </Button>

              <Button
                onClick={handleProcessText}
                disabled={isProcessing || !medicationText.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'fr' ? 'Analyse...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Pill className="mr-2 h-4 w-4" />
                    {language === 'fr' ? 'Analyser le texte' : 'Parse Text'}
                  </>
                )}
              </Button>
            </div>

            {/* Success indicator */}
            {extractedCount !== null && extractedCount > 0 && !isProcessing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {language === 'fr' 
                      ? `${extractedCount} médicaments extraits avec succès et ajoutés aux ${isInpatient ? 'médicaments hospitaliers' : 'médicaments à domicile'}`
                      : `${extractedCount} medications successfully extracted and added to ${isInpatient ? 'hospital medications' : 'home medications'}`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-medium">
                {language === 'fr' ? 'Format attendu:' : 'Expected format:'}
              </p>
              <p>
                {language === 'fr' 
                  ? 'Date Heure    Nom_Médicament [Marque]    Dosage Route Fréquence Instructions'
                  : 'Date Time    Medication_Name [Brand]    Dosage Route Frequency Instructions'}
              </p>
              <p className="italic">
                {language === 'fr' 
                  ? 'Seul le nom générique et le dosage/fréquence seront extraits'
                  : 'Only generic name and dosage/frequency will be extracted'}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-100 border border-blue-300 rounded-full"></div>
                  <span>{language === 'fr' ? 'Domicile' : 'Home'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-100 border border-green-300 rounded-full"></div>
                  <span>{language === 'fr' ? 'Hôpital' : 'Hospital'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}