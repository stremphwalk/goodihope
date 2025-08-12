import React, { useState } from 'react';
import { DotPhraseTextarea } from './DotPhraseTextarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

const demoText = `Chief Complaint: Chest pain

HPI: 54M with HTN presenting with intermittent chest discomfort.
Medication plan: Start amlodipine [[2.5 mg|5 mg|10 mg]] PO daily.
If edema present, consider switch to ARB.

Discharge: Follow-up in [[1|2|4]] weeks with GP.

Assessment: The patient will be started on [[Tazocin|Ceftriaxone|Meropenem]] for [[5 days|7 days|10 days]].`;

export function SmartPhraseDemo() {
  const [demoValue, setDemoValue] = useState(demoText);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Lightbulb className="h-5 w-5" />
            Smart Phrase Context Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700">
          <p className="mb-3">
            This demo shows the new smart phrase context highlighting feature:
          </p>
          <ul className="space-y-1 mb-3">
            <li>• Lines with smart phrases like <code className="bg-amber-100 px-1 rounded">[[option1|option2]]</code> are visually highlighted</li>
            <li>• Click on any highlighted phrase to see available options</li>
            <li>• Type <code className="bg-amber-100 px-1 rounded">/phrase</code> + space to expand dot phrases</li>
            <li>• Copy/paste preserves plain text for EHR compatibility</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">Try: /htn + space</Badge>
            <Badge variant="outline" className="text-xs">Try: /plan + space</Badge>
            <Badge variant="outline" className="text-xs">Click [[options]]</Badge>
          </div>
        </CardContent>
      </Card>

      <DotPhraseTextarea
        value={demoValue}
        onChange={setDemoValue}
        placeholder="Start typing or use /phrase + space to expand..."
        rows={12}
        className="min-h-[400px]"
      />
    </div>
  );
}