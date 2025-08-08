import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  RotateCcw, 
  FileText
} from 'lucide-react';
import { DotPhraseTextarea } from '@/components/DotPhraseTextarea';

interface SimpleLivePreviewProps {
  note: string;
  onNoteChange: (note: string) => void;
  onCopyNote: () => void;
  onResetNote?: () => void;
  className?: string;
  onBlur?: () => void;
}

export function SimpleLivePreview({
  note,
  onNoteChange,
  onCopyNote,
  onResetNote,
  className = "",
  onBlur
}: SimpleLivePreviewProps) {
  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;

  return (
    <div className={`w-full max-w-none h-full flex flex-col ${className}`}>
      <Card className="w-full flex-1 flex flex-col border-0 shadow-none bg-white">
        <CardHeader className="bg-white border-b border-gray-100 flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 w-full">
          {/* Action Bar */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between w-full">
            <div className="flex gap-2">
              <Button
                onClick={onCopyNote}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-gray-200 hover:border-gray-300 hover:bg-white"
              >
                <Copy className="w-4 h-4" />
                Copy Note
              </Button>
              {onResetNote && (
                <Button
                  onClick={onResetNote}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-gray-200 hover:border-gray-300 hover:bg-white"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
            
          </div>
          
          {/* Content Area */}
          <div className="flex-1 relative w-full">
            
            <DotPhraseTextarea
              value={note}
              onChange={onNoteChange}
              placeholder="Generated medical note will appear here..."
              className="w-full h-full min-h-[500px] font-mono text-[15px] resize-none border-0 focus:ring-0 p-6 leading-6 bg-white text-gray-800"
              onBlur={onBlur}
            />
          </div>
          
          {/* Status Bar */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 w-full">
            <div className="flex items-center gap-4">
              <span>Medical Note Document</span>
              <Separator orientation="vertical" className="h-3" />
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <Separator orientation="vertical" className="h-3" />
              <span>Auto-saved</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}