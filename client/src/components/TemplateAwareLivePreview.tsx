import React from 'react';
import { SimpleLivePreview } from './SimpleLivePreview';

interface TemplateAwareLivePreviewProps {
  noteData: Record<string, string>;
  note: string;
  onNoteChange: (note: string) => void;
  onCopyNote: () => void;
  onResetNote?: () => void;
  documentedSystems?: number;
  totalSystems?: number;
  generatedNote?: string;
  className?: string;
  onBlur?: () => void;
}

export function TemplateAwareLivePreview({
  note,
  onNoteChange,
  onCopyNote,
  onResetNote,
  className = "",
  onBlur
}: TemplateAwareLivePreviewProps) {
  return (
    <SimpleLivePreview
      note={note}
      onNoteChange={onNoteChange}
      onCopyNote={onCopyNote}
      onResetNote={onResetNote}
      className={className}
      onBlur={onBlur}
    />
  );
} 