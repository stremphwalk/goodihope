import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface SymptomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symptomKey: string;
  currentSeverity?: 'mild' | 'moderate' | 'severe';
  currentNote?: string;
  onSave: (severity: 'mild' | 'moderate' | 'severe' | undefined, note: string | undefined) => void;
  description: { en: string; fr: string };
}

export const SymptomDetailsModal: React.FC<SymptomDetailsModalProps> = ({
  isOpen,
  onClose,
  symptomKey,
  currentSeverity,
  currentNote,
  onSave,
  description,
}) => {
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | undefined>(currentSeverity);
  const [note, setNote] = useState(currentNote || '');
  const { language } = useLanguage();

  const handleSave = () => {
    if (note.length > 200) {
      alert(language === 'fr' ? 'Note trop longue (max 200 chars)' : 'Note too long (max 200 chars)');
      return;
    }
    onSave(severity, note.trim() || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white opacity-100 border border-gray-300 shadow-xl backdrop-blur-none">
        <DialogHeader>
          <DialogTitle>{language === 'fr' ? 'Détails du Symptôme' : 'Symptom Details'} - {symptomKey}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">{language === 'fr' ? description.fr : description.en}</p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'fr' ? 'Sévérité' : 'Severity'}
            </label>
            <Select value={severity || ''} onValueChange={(val: 'mild' | 'moderate' | 'severe') => setSeverity(val)}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'fr' ? 'Sélectionner' : 'Select'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">{language === 'fr' ? 'Léger' : 'Mild'}</SelectItem>
                <SelectItem value="moderate">{language === 'fr' ? 'Modéré' : 'Moderate'}</SelectItem>
                <SelectItem value="severe">{language === 'fr' ? 'Sévère' : 'Severe'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'fr' ? 'Notes' : 'Notes'}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={language === 'fr' ? 'Ajouter des notes (max 200 chars)...' : 'Add notes (max 200 chars)...'}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">{note.length}/200</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'fr' ? 'Annuler' : 'Cancel'}</Button>
          <Button onClick={handleSave}>{language === 'fr' ? 'Sauvegarder' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};