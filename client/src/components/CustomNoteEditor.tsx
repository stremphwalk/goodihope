import React from 'react';
import { Button } from '@/components/ui/button';
import { DotPhraseTextarea } from '@/components/DotPhraseTextarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, Edit3 } from 'lucide-react';

interface CustomNoteEditorProps {
  note: string;
  onChange: (value: string) => void;
  onBack: () => void;
}

export function CustomNoteEditor({ note, onChange, onBack }: CustomNoteEditorProps) {
  const { language } = useLanguage();
  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'fr' ? 'Note Personnalisée' : 'Custom Note'}
          </h2>
        </div>
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour' : 'Back to Note Types'}
        </Button>
      </div>
      <div className="flex-1">
        <DotPhraseTextarea
          value={note}
          onChange={onChange}
          placeholder={language === 'fr' ? 'Commencez votre note...' : 'Start your note...'}
          className="w-full h-full min-h-[80vh] font-mono text-base resize-none border border-gray-200 rounded-lg p-4"
        />
      </div>
    </div>
  );
}

export default CustomNoteEditor;
